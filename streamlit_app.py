import streamlit as st
import pandas as pd
from st_supabase_connection import SupabaseConnection, execute_query

# --- PAGE CONFIG ---
st.set_page_config(page_title="Birdfeeder Financials", layout="wide")

# --- CUSTOM CSS FOR DARK NAVY THEME ---
st.markdown("""
    <style>
    .stApp {
        background-color: #0a192f;
        color: #e6f1ff;
    }
    .stSelectbox label, .stMultiSelect label, .stSlider label {
        color: #64ffda !important;
    }
    </style>
    """, unsafe_allow_html=True)

# --- DATABASE CONNECTION ---
conn = st.connection("supabase", type=SupabaseConnection)

@st.cache_data(ttl="1h")
def load_data():
    # 1. Build the query using standard Supabase syntax
    query = conn.table("daily_kpis").select("*")
    
    # 2. Use execute_query to run it with caching
    response = execute_query(query, ttl="1h")
    
    df = pd.DataFrame(response.data)
    df['date'] = pd.to_datetime(df['date'])
    return df.sort_values('date')

# --- DASHBOARD LOGIC ---
try:
    df = load_data()

    st.title("Birdfeeder Financial Dashboard")
    st.caption("Data synced daily via GitHub Actions")

    # --- SIDEBAR CONTROLS ---
    st.sidebar.header("Chart Settings")
    
    # 1. Date Range Selector
    min_date = df['date'].min().to_pydatetime()
    max_date = df['date'].max().to_pydatetime()
    date_range = st.sidebar.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )

    # 2. KPI Selector
    available_metrics = ['revenue', 'cogs', 'comps', 'processing', 'net_income']

    st.sidebar.subheader("Visibility Toggle")
    # We create a list of all possible lines (Raw and MA)
    all_possible_lines = []
    for m in available_metrics:
        all_possible_lines.append(f"{m.title()}")
        all_possible_lines.append(f"{m.title()} (Moving Avg)")
    
    selected_lines = st.sidebar.multiselect(
        "Select lines to display",
        options=all_possible_lines,
        default=["Revenue", "Revenue (Moving Avg)", "Net_Income"]
    )

    # 3. Moving Average Toggle
    ma_period = st.sidebar.slider("MA Period (Days)", 2, 30, 7)

    # --- DATA PROCESSING ---
    mask = (df['date'] >= pd.Timestamp(date_range[0])) & (df['date'] <= pd.Timestamp(date_range[1]))
    filtered_df = df.loc[mask].copy()
    
    # Calculate ALL moving averages behind the scenes
    for m in available_metrics:
        filtered_df[f"{m.title()} (Moving Avg)"] = filtered_df[m].rolling(window=ma_period).mean()
        # Rename raw columns for cleaner legend display
        filtered_df[m.title()] = filtered_df[m]
    
    # --- VISUALIZATION ---
    if not selected_lines:
        st.warning("Select at least one line in the sidebar to view the chart.")
    else:
        # Plot only what is selected in the multiselect
        chart_data = filtered_df.set_index('date')[selected_lines]
        st.line_chart(chart_data)

    # --- VISUALIZATION ---
    if not selected_kpis:
        st.warning("Please select at least one KPI from the sidebar.")
    else:
        # Prepare plot data
        plot_cols = selected_kpis + ([f"{kpi}_MA" for kpi in selected_kpis] if show_ma else [])
        chart_data = filtered_df.set_index('date')[plot_cols]
        
        st.line_chart(chart_data)

    # --- METRICS SUMMARY ---
    st.subheader("Period Summary")
    cols = st.columns(len(selected_kpis))
    for i, kpi in enumerate(selected_kpis):
        total = filtered_df[kpi].sum()
        cols[i].metric(label=kpi.replace('_', ' ').title(), value=f"${total:,.2f}")

except Exception as e:
    st.error(f"Waiting for database records... Error: {e}")
    st.info("Once your GitHub Action runs for the first time, the data will appear here.")
