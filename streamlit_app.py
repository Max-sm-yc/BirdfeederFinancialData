import streamlit as st
import pandas as pd
import plotly.express as px
from st_supabase_connection import SupabaseConnection, execute_query

# --- PAGE CONFIG ---
st.set_page_config(page_title="Analyst Insights | Birdfeeder", layout="wide")

# --- CUSTOM CSS ---
st.markdown("""
    <style>
    .stApp { background-color: #0a192f; color: #e6f1ff; }
    [data-testid="stMetricValue"] { color: #64ffda; }
    </style>
    """, unsafe_allow_html=True)

conn = st.connection("supabase", type=SupabaseConnection)

@st.cache_data(ttl="1h")
def load_data():
    query = conn.table("daily_kpis").select("*")
    response = execute_query(query, ttl="1h")
    df = pd.DataFrame(response.data)
    df['date'] = pd.to_datetime(df['date'])
    # Add engineered features for analysts
    df['day_of_week'] = df['date'].dt.day_name()
    df['net_margin'] = (df['net_income'] / df['revenue']) * 100
    return df.sort_values('date')

try:
    df = load_data()
    
    # --- FILTERS ---
    st.title("Birdfeeder Financial Data")
    
    with st.sidebar:
        st.header("Analysis Parameters")
        date_range = st.date_input("Date Range", value=(df['date'].min(), df['date'].max()))
        ma_period = st.slider("Smoothing (Days)", 2, 30, 7)

    # Filter data based on selection
    mask = (df['date'] >= pd.Timestamp(date_range[0])) & (df['date'] <= pd.Timestamp(date_range[1]))
    f_df = df.loc[mask].copy()

    # --- ROW 1: DELTA METRICS ---
    st.subheader("Performance Momentum")
    m1, m2, m3, m4 = st.columns(4)
    
    def get_delta(col):
        current = f_df[col].iloc[-1]
        prev_avg = f_df[col].iloc[-8:-1].mean() # Last 7 days prior to today
        return current, current - prev_avg

    val, delta = get_delta('revenue')
    m1.metric("Current Revenue", f"${val:,.2f}", f"${delta:,.2f} vs 7D Avg")
    
    val, delta = get_delta('net_income')
    m2.metric("Current Net Income", f"${val:,.2f}", f"${delta:,.2f} vs 7D Avg")
    
    val, delta = get_delta('net_margin')
    m3.metric("Net Margin %", f"{val:.1f}%", f"{delta:.1f}% vs 7D Avg")
    
    m4.metric("COGS Ratio", f"{(f_df['cogs'].sum()/f_df['revenue'].sum()*100):.1f}%")

    # --- ROW 2: RUN RATE & MARGIN TRENDS ---
    col_left, col_right = st.columns(2)
    
    with col_left:
        st.write("#### Cumulative Run Rate (Revenue)")
        f_df['cumulative_rev'] = f_df['revenue'].cumsum()
        st.area_chart(f_df.set_index('date')['cumulative_rev'], color="#64ffda")

    with col_right:
        st.write("#### Net Margin Stability (%)")
        f_df['margin_ma'] = f_df['net_margin'].rolling(window=ma_period).mean()
        st.line_chart(f_df.set_index('date')[['net_margin', 'margin_ma']])

    # --- ROW 3: DAY OF WEEK & HEATMAPS ---
    st.divider()
    col_a, col_b = st.columns([1, 2])

    with col_a:
        st.write("#### Avg Revenue by Day")
        dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dow_avg = f_df.groupby('day_of_week')['revenue'].mean().reindex(dow_order)
        st.bar_chart(dow_avg, color="#112240")

    with col_b:
        st.write("#### Net Income Heatmap (Daily)")
        # Reshaping for heatmap
        f_df['week'] = f_df['date'].dt.isocalendar().week
        heatmap_data = f_df.pivot(index='day_of_week', columns='week', values='net_income')
        heatmap_data = heatmap_data.reindex(dow_order)
        
        fig = px.imshow(heatmap_data, 
                        labels=dict(x="Week Number", y="Day", color="Profit"),
                        color_continuous_scale='Viridis',
                        aspect="auto")
        fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="#e6f1ff")
        st.plotly_chart(fig, use_container_width=True)

except Exception as e:
    st.error(f"Dashboard Error: {e}")
