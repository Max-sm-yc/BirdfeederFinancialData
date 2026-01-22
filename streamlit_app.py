import streamlit as st
import pandas as pd
import plotly.express as px
from st_supabase_connection import SupabaseConnection, execute_query

# --- PAGE CONFIG ---
st.set_page_config(page_title="Birdfeeder Analyst Suite", layout="wide")

# --- THEME STYLING ---
st.markdown("""
    <style>
    .stApp { background-color: #0a192f; color: #e6f1ff; }
    [data-testid="stMetricValue"] { color: #64ffda; }
    .stSelectbox label, .stMultiSelect label, .stSlider label { color: #64ffda !important; }
    </style>
    """, unsafe_allow_html=True)

# --- DB CONNECTION ---
conn = st.connection("supabase", type=SupabaseConnection)

@st.cache_data(ttl="1h")
def load_data():
    query = conn.table("daily_kpis").select("*")
    response = execute_query(query, ttl="1h")
    df = pd.DataFrame(response.data)
    df['date'] = pd.to_datetime(df['date'])
    # Analyst Engineering
    df['day_of_week'] = df['date'].dt.day_name()
    df['net_margin'] = (df['net_income'] / df['revenue']) * 100
    return df.sort_values('date')

try:
    df = load_data()

    st.title("📈 Birdfeeder Financial Dashboard")
    st.caption("Centralized Diagnostic Suite for Business Analysts")

    # --- SIDEBAR: CONTROLS ---
    with st.sidebar:
        st.header("Chart Settings")
        
        # 1. Date Selection
        min_date, max_date = df['date'].min().to_pydatetime(), df['date'].max().to_pydatetime()
        date_range = st.date_input("Date Range", value=(min_date, max_date), min_value=min_date, max_value=max_date)
        
        # 2. Advanced Multi-Line Selector
        available_metrics = ['revenue', 'cogs', 'comps', 'processing', 'net_income']
        line_options = []
        for m in available_metrics:
            line_options.append(m.title())
            line_options.append(f"{m.title()} (Moving Avg)")
            
        selected_lines = st.multiselect("Visible Lines", options=line_options, default=["Revenue", "Revenue (Moving Avg)", "Net_Income"])
        
        # 3. MA Smoothing
        ma_period = st.slider("MA Window (Days)", 2, 30, 7)

    # --- DATA PROCESSING ---
    mask = (df['date'] >= pd.Timestamp(date_range[0])) & (df['date'] <= pd.Timestamp(date_range[1]))
    f_df = df.loc[mask].copy()

    # Pre-calculate Display Columns
    for m in available_metrics:
        f_df[f"{m.title()} (Moving Avg)"] = f_df[m].rolling(window=ma_period).mean()
        f_df[m.title()] = f_df[m]

    # --- TOP ROW: MOMENTUM METRICS ---
    st.subheader("Performance vs 7D Average")
    m1, m2, m3, m4 = st.columns(4)
    
    def get_delta(col):
        curr = f_df[col].iloc[-1]
        prev = f_df[col].iloc[-8:-1].mean()
        return curr, curr - prev

    r, rd = get_delta('revenue')
    m1.metric("Revenue", f"${r:,.2f}", f"${rd:,.2f}")
    
    ni, nid = get_delta('net_income')
    m2.metric("Net Income", f"${ni:,.2f}", f"${nid:,.2f}")
    
    nm, nmd = get_delta('net_margin')
    m3.metric("Net Margin %", f"{nm:.1f}%", f"{nmd:.1f}%")
    
    m4.metric("COGS %", f"{(f_df['cogs'].sum()/f_df['revenue'].sum()*100):.1f}%")

    # --- MAIN CHART: INTERACTIVE LINE GRAPH ---
    st.divider()
    if selected_lines:
        st.write("#### Historical KPI Trends")
        st.line_chart(f_df.set_index('date')[selected_lines])
    else:
        st.warning("Please select at least one line in the sidebar.")

    # --- ANALYST ROW: RUN RATE & MARGIN ---
    col1, col2 = st.columns(2)
    with col1:
        st.write("#### Revenue Run Rate (Cumulative)")
        f_df['cum_rev'] = f_df['revenue'].cumsum()
        st.area_chart(f_df.set_index('date')['cum_rev'], color="#64ffda")
    with col2:
        st.write("#### Net Margin Stability")
        f_df['margin_ma'] = f_df['net_margin'].rolling(window=ma_period).mean()
        st.line_chart(f_df.set_index('date')[['net_margin', 'margin_ma']])

    # --- BOTTOM ROW: DOW & HEATMAP ---
    st.divider()
    col_a, col_b = st.columns([1, 2])
    dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

   with col_a:
    st.write("#### Average Revenue by Day")
    
    # 1. Define the correct chronological order
    dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    # 2. Group by day and calculate the mean
    dow_avg = f_df.groupby('day_of_week')['revenue'].mean()
    
    # 3. Reindex to force the Mon-Sun order
    dow_avg = dow_avg.reindex(dow_order)
    
    # 4. Display the chart
    st.bar_chart(dow_avg, color="#112240")

    with col_b:
        st.write("#### Net Income Heatmap")
        f_df['week'] = f_df['date'].dt.isocalendar().week
        h_data = f_df.pivot(index='day_of_week', columns='week', values='net_income').reindex(dow_order)
        fig = px.imshow(h_data, color_continuous_scale='Viridis', aspect="auto")
        fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#e6f1ff")
        st.plotly_chart(fig, use_container_width=True)

    # --- DATA TABLE ---
    with st.expander("View Raw Filtered Data"):
        st.dataframe(f_df.drop(columns=['week', 'day_of_week', 'cum_rev']), use_container_width=True)
        st.download_button("Download CSV", f_df.to_csv().encode('utf-8'), "financial_export.csv", "text/csv")

except Exception as e:
    st.error(f"Dashboard Load Error: {e}")
