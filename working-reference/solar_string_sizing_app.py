import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import io
import base64

st.set_page_config(page_title="Solar PV String Sizing Tool", layout="wide")

# CSS for better styling
st.markdown("""
<style>
.main-header {
    font-size: 2.5rem;
    color: #1E88E5;
    text-align: center;
}
.section-header {
    font-size: 1.8rem;
    color: #0D47A1;
    margin-top: 1rem;
    margin-bottom: 1rem;
}
.subsection-header {
    font-size: 1.5rem;
    color: #1565C0;
    margin-top: 0.8rem;
    margin-bottom: 0.8rem;
}
.info-text {
    background-color: #E3F2FD;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}
.results-container {
    background-color: #F5F5F5;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
}
.success-message {
    background-color: #EDF7ED;
    color: #1B5E20;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
}
.warning-message {
    background-color: #FFF8E1;
    color: #F57F17;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
}
.error-message {
    background-color: #FFEBEE;
    color: #B71C1C;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
}
</style>
""", unsafe_allow_html=True)

# Main title
st.markdown("<h1 class='main-header'>Solar PV String Sizing Tool</h1>", unsafe_allow_html=True)
st.markdown("<p class='info-text'>This tool helps design optimal string configurations for solar PV systems with multiple azimuths, following IEC standards and industry best practices.</p>", unsafe_allow_html=True)

# Create tabs for the application
tabs = st.tabs(["Project Setup", "Module & Inverter Specs", "Azimuth Configuration", "String Sizing Results", "System Summary"])

# Project Setup Tab
with tabs[0]:
    st.markdown("<h2 class='section-header'>Project Information</h2>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        project_name = st.text_input("Project Name", "Sample Solar Project")
        project_location = st.text_input("Project Location", "Sample Location")
        
    with col2:
        project_capacity = st.number_input("Target Project Capacity (kWp)", min_value=1.0, value=100.0, step=0.1)
        target_dc_ac_ratio = st.number_input("Target DC/AC Ratio", min_value=1.0, value=1.2, step=0.05, 
                                           help="The ratio of DC array capacity to AC inverter capacity")
    
    st.markdown("<h2 class='section-header'>Site Conditions</h2>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        min_ambient_temp = st.number_input("Minimum Ambient Temperature (°C)", value=-10.0, step=1.0,
                                       help="The lowest expected ambient temperature at the site")
    
    with col2:
        max_ambient_temp = st.number_input("Maximum Ambient Temperature (°C)", value=45.0, step=1.0,
                                     help="The highest expected ambient temperature at the site")
    
    with col3:
        temp_difference = st.number_input("Module-Ambient Temperature Difference (°C)", value=25.0, step=1.0,
                                    help="Typical temperature difference between module and ambient (typically 25-30°C)")
    
    # Calculate min/max module temperatures
    min_module_temp = min_ambient_temp
    max_module_temp = max_ambient_temp + temp_difference
    
    st.info(f"Calculated Module Temperature Range: {min_module_temp}°C to {max_module_temp}°C")
    
    # Safety factors
    st.markdown("<h2 class='section-header'>Safety Factors & Margins</h2>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        voltage_safety_factor = st.number_input("Voltage Safety Factor", min_value=1.0, value=1.2, step=0.05,
                                         help="Safety factor for maximum voltage (typically 1.2 per IEC standards)")
    
    with col2:
        current_safety_factor = st.number_input("Current Safety Factor", min_value=1.0, value=1.25, step=0.05,
                                        help="Safety factor for string current (typically 1.25)")

# Module & Inverter Specifications Tab
with tabs[1]:
    st.markdown("<h2 class='section-header'>PV Module Specifications</h2>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        module_manufacturer = st.text_input("Module Manufacturer", "Sample Manufacturer")
        module_model = st.text_input("Module Model", "Sample Model")
        module_power = st.number_input("Module Power Rating (Wp)", min_value=100, value=550, step=5)
        module_voc = st.number_input("Module Open Circuit Voltage - Voc (V)", min_value=10.0, value=49.5, step=0.1)
        module_vmp = st.number_input("Module MPP Voltage - Vmp (V)", min_value=10.0, value=41.3, step=0.1)
    
    with col2:
        module_isc = st.number_input("Module Short Circuit Current - Isc (A)", min_value=0.1, value=13.86, step=0.01)
        module_imp = st.number_input("Module MPP Current - Imp (A)", min_value=0.1, value=13.32, step=0.01)
        voc_temp_coef = st.number_input("Voc Temperature Coefficient (%/°C)", min_value=-1.0, value=-0.25, step=0.01) / 100
        vmp_temp_coef = st.number_input("Vmp Temperature Coefficient (%/°C)", min_value=-1.0, value=-0.30, step=0.01) / 100
        isc_temp_coef = st.number_input("Isc Temperature Coefficient (%/°C)", min_value=-0.1, value=0.05, step=0.01) / 100
    
    st.markdown("<h2 class='section-header'>Inverter Specifications</h2>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        inverter_manufacturer = st.text_input("Inverter Manufacturer", "Sample Inverter Company")
        inverter_model = st.text_input("Inverter Model", "Sample Inverter Model")
        inverter_count = st.number_input("Number of Inverters", min_value=1, value=1, step=1)
    
    with col2:
        inverter_ac_power = st.number_input("Inverter AC Power Rating (kW)", min_value=1.0, value=100.0, step=1.0)
        inverter_max_dc_power = st.number_input("Inverter Maximum DC Power (kW)", min_value=1.0, value=150.0, step=1.0)
        inverter_mppt_count = st.number_input("Number of MPPTs per Inverter", min_value=1, value=6, step=1)
    
    with col3:
        inverter_min_voltage = st.number_input("Inverter Minimum MPPT Voltage (V)", min_value=100, value=200, step=10)
        inverter_max_voltage = st.number_input("Inverter Maximum DC Voltage (V)", min_value=100, value=1000, step=10)
        inverter_max_mppt_current = st.number_input("Maximum Current per MPPT (A)", min_value=1.0, value=26.0, step=0.1)
    
    inverter_string_inputs_per_mppt = st.number_input("String Inputs per MPPT", min_value=1, value=2, step=1)
    
    # Calculate and display total system statistics
    total_mppts = inverter_count * inverter_mppt_count
    total_string_inputs = total_mppts * inverter_string_inputs_per_mppt
    
    st.markdown("<div class='info-text'>", unsafe_allow_html=True)
    st.write(f"Total System MPPTs: {total_mppts}")
    st.write(f"Total String Inputs: {total_string_inputs}")
    st.write(f"Total AC Capacity: {inverter_count * inverter_ac_power:.2f} kW")
    st.write(f"Maximum DC Capacity: {inverter_count * inverter_max_dc_power:.2f} kW")
    st.markdown("</div>", unsafe_allow_html=True)

# Azimuth Configuration Tab
with tabs[2]:
    st.markdown("<h2 class='section-header'>Azimuth Configuration</h2>", unsafe_allow_html=True)
    st.markdown("<p class='info-text'>Define the different module orientations in your project. Each azimuth group will be connected to dedicated MPPTs.</p>", unsafe_allow_html=True)
    
    # Number of different azimuths in the project
    azimuth_count = st.number_input("Number of Different Azimuths/Orientations", min_value=1, value=3, max_value=10, step=1)
    
    # Create a container for azimuth inputs
    azimuth_data = []
    
    for i in range(azimuth_count):
        st.markdown(f"<h3 class='subsection-header'>Azimuth Group {i+1}</h3>", unsafe_allow_html=True)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            azimuth_name = st.text_input(f"Azimuth Name", f"Azimuth {i+1}", key=f"az_name_{i}")
            
        with col2:
            azimuth_angle = st.number_input(f"Angle (°)", min_value=0, max_value=359, value=90 + 90*i, step=5, key=f"az_angle_{i}")
            
        with col3:
            tilt_angle = st.number_input(f"Tilt (°)", min_value=0, max_value=90, value=15, step=1, key=f"az_tilt_{i}")
            
        with col4:
            module_count = st.number_input(f"Number of Modules", min_value=1, value=100, step=1, key=f"az_modules_{i}")
        
        priority = st.slider(f"Priority (1 = highest)", min_value=1, max_value=azimuth_count, value=i+1, key=f"az_priority_{i}")
        
        azimuth_data.append({
            "name": azimuth_name,
            "angle": azimuth_angle,
            "tilt": tilt_angle,
            "modules": module_count,
            "priority": priority
        })
    
    # Convert to DataFrame for easier manipulation
    azimuth_df = pd.DataFrame(azimuth_data)
    
    # Display azimuth summary
    st.markdown("<h3 class='subsection-header'>Azimuth Summary</h3>", unsafe_allow_html=True)
    azimuth_df['dc_power_kwp'] = azimuth_df['modules'] * module_power / 1000
    azimuth_df['percentage'] = azimuth_df['modules'] / azimuth_df['modules'].sum() * 100
    
    # Add columns for display
    display_df = azimuth_df.copy()
    display_df = display_df.rename(columns={
        'name': 'Azimuth Name', 
        'angle': 'Angle (°)', 
        'tilt': 'Tilt (°)', 
        'modules': 'Module Count',
        'priority': 'Priority',
        'dc_power_kwp': 'DC Power (kWp)',
        'percentage': 'Percentage (%)'
    })
    
    display_df['DC Power (kWp)'] = display_df['DC Power (kWp)'].round(2)
    display_df['Percentage (%)'] = display_df['Percentage (%)'].round(2)
    
    st.dataframe(display_df, use_container_width=True)
    
    # Plot azimuth distribution
    st.markdown("<h3 class='subsection-header'>Azimuth Distribution</h3>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig = px.pie(azimuth_df, values='modules', names='name', title='Module Distribution by Azimuth')
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        fig = px.bar(azimuth_df, x='name', y='dc_power_kwp', 
                     labels={'name': 'Azimuth', 'dc_power_kwp': 'DC Power (kWp)'},
                     title='DC Power by Azimuth')
        st.plotly_chart(fig, use_container_width=True)
    
    total_modules = azimuth_df['modules'].sum()
    total_dc_power = azimuth_df['dc_power_kwp'].sum()
    
    st.markdown("<div class='info-text'>", unsafe_allow_html=True)
    st.write(f"Total Modules: {total_modules}")
    st.write(f"Total DC Power: {total_dc_power:.2f} kWp")
    
    # Calculate and display DC/AC ratio
    total_ac_power = inverter_count * inverter_ac_power
    dc_ac_ratio = total_dc_power / total_ac_power if total_ac_power > 0 else 0
    
    st.write(f"System DC/AC Ratio: {dc_ac_ratio:.3f}")
    
    if abs(dc_ac_ratio - target_dc_ac_ratio) > 0.1:
        st.warning(f"Current DC/AC ratio ({dc_ac_ratio:.3f}) differs from target ({target_dc_ac_ratio:.3f})")
    else:
        st.success(f"Current DC/AC ratio ({dc_ac_ratio:.3f}) is close to target ({target_dc_ac_ratio:.3f})")
    
    st.markdown("</div>", unsafe_allow_html=True)

# String Sizing Results Tab
with tabs[3]:
    st.markdown("<h2 class='section-header'>String Sizing Calculation</h2>", unsafe_allow_html=True)
    
    if st.button("Calculate String Configuration", type="primary"):
        # Calculate module voltage at temperature extremes
        voc_at_min_temp = module_voc * (1 + voc_temp_coef * (min_module_temp - 25))
        vmp_at_max_temp = module_vmp * (1 + vmp_temp_coef * (max_module_temp - 25))
        isc_at_max_temp = module_isc * (1 + isc_temp_coef * (max_module_temp - 25))
        
        # Calculate string limits
        max_modules_per_string = int(inverter_max_voltage / voc_at_min_temp)
        min_modules_per_string = int(np.ceil(inverter_min_voltage / vmp_at_max_temp))
        
        st.markdown("<div class='info-text'>", unsafe_allow_html=True)
        st.write(f"Module Voc at {min_module_temp}°C: {voc_at_min_temp:.2f} V")
        st.write(f"Module Vmp at {max_module_temp}°C: {vmp_at_max_temp:.2f} V")
        st.write(f"Minimum modules per string: {min_modules_per_string}")
        st.write(f"Maximum modules per string: {max_modules_per_string}")
        st.markdown("</div>", unsafe_allow_html=True)
        
        if min_modules_per_string > max_modules_per_string:
            st.markdown("<div class='error-message'>ERROR: Minimum modules per string exceeds maximum! The inverter's MPPT voltage window is incompatible with the selected modules under the given temperature conditions.</div>", unsafe_allow_html=True)
        else:
            # Calculate strings per MPPT
            max_strings_per_mppt = min(
                int(inverter_max_mppt_current / isc_at_max_temp),
                inverter_string_inputs_per_mppt
            )
            
            # Sort azimuths by priority
            sorted_azimuths = azimuth_df.sort_values('priority').copy()
            
            # Allocate MPPTs to azimuths based on module counts and priority
            allocated_mppts = {}
            remaining_mppts = total_mppts
            
            # First pass: Calculate required MPPTs for each azimuth
            for idx, row in sorted_azimuths.iterrows():
                azimuth_name = row['name']
                module_count = row['modules']
                
                # Choose optimal string length
                optimal_string_length = max(
                    min(
                        max_modules_per_string,
                        int(module_count / (max_strings_per_mppt * (remaining_mppts / len(sorted_azimuths))))
                    ),
                    min_modules_per_string
                )
                
                # Calculate number of strings for this azimuth
                num_strings = int(module_count / optimal_string_length)
                remaining_modules = module_count % optimal_string_length
                
                # Calculate MPPTs needed
                mppts_needed = int(np.ceil(num_strings / max_strings_per_mppt))
                
                allocated_mppts[azimuth_name] = {
                    'mppts_needed': mppts_needed,
                    'optimal_string_length': optimal_string_length,
                    'num_strings': num_strings,
                    'remaining_modules': remaining_modules,
                    'module_count': module_count
                }
                
                remaining_mppts -= mppts_needed
            
            # Check if we have enough MPPTs
            if remaining_mppts < 0:
                st.markdown("<div class='error-message'>WARNING: Not enough MPPTs available for optimal configuration. Some modules may not be used or string lengths need adjustment.</div>", unsafe_allow_html=True)
                
                # Redistribute MPPTs based on priority
                remaining_mppts = total_mppts
                for idx, row in sorted_azimuths.iterrows():
                    azimuth_name = row['name']
                    module_count = row['modules']
                    priority = row['priority']
                    
                    # Allocate MPPTs proportionally to module count and priority
                    mppt_allocation = max(1, int(remaining_mppts * (module_count / total_modules) * (1 / priority)))
                    mppt_allocation = min(mppt_allocation, remaining_mppts)
                    
                    allocated_mppts[azimuth_name]['mppts_allocated'] = mppt_allocation
                    remaining_mppts -= mppt_allocation
            else:
                # Allocate as needed
                for azimuth_name in allocated_mppts:
                    allocated_mppts[azimuth_name]['mppts_allocated'] = allocated_mppts[azimuth_name]['mppts_needed']
            
            # Final string configuration
            string_config = []
            
            for idx, row in sorted_azimuths.iterrows():
                azimuth_name = row['name']
                allocation = allocated_mppts[azimuth_name]
                
                mppts_allocated = allocation['mppts_allocated']
                optimal_string_length = allocation['optimal_string_length']
                module_count = allocation['module_count']
                
                # Calculate how many strings we can accommodate with allocated MPPTs
                max_possible_strings = mppts_allocated * max_strings_per_mppt
                
                # Recalculate optimal string length to use all modules if possible
                if max_possible_strings > 0:
                    # Try to use all modules
                    optimal_string_length = max(
                        min(int(module_count / max_possible_strings) + 1, max_modules_per_string),
                        min_modules_per_string
                    )
                
                # Calculate strings and modules used
                strings_allocated = min(int(module_count / optimal_string_length), max_possible_strings)
                modules_used = strings_allocated * optimal_string_length
                remaining_modules = module_count - modules_used

                # Handle remaining modules by creating shorter strings if possible
                additional_strings = 0
                additional_modules = 0
                
                if remaining_modules >= min_modules_per_string and strings_allocated < max_possible_strings:
                    additional_strings = 1
                    additional_modules = remaining_modules
                    remaining_modules = 0
                
                # Calculate electrical characteristics of strings
                voc_at_min_temp_string = voc_at_min_temp * optimal_string_length
                vmp_at_max_temp_string = vmp_at_max_temp * optimal_string_length
                
                string_config.append({
                    'azimuth_name': azimuth_name,
                    'mppts_allocated': mppts_allocated,
                    'standard_string_length': optimal_string_length,
                    'standard_strings': strings_allocated,
                    'additional_string_length': additional_modules,
                    'additional_strings': additional_strings,
                    'total_strings': strings_allocated + additional_strings,
                    'modules_used': modules_used + additional_modules,
                    'remaining_modules': remaining_modules,
                    'voc_at_min_temp': voc_at_min_temp_string,
                    'vmp_at_max_temp': vmp_at_max_temp_string,
                    'dc_power_kwp': (modules_used + additional_modules) * module_power / 1000
                })
            
            # Convert to DataFrame for display
            string_config_df = pd.DataFrame(string_config)
            
            # Create summary dataframe for display
            summary_df = string_config_df[['azimuth_name', 'mppts_allocated', 'standard_string_length', 
                                          'standard_strings', 'additional_string_length', 'additional_strings',
                                          'modules_used', 'remaining_modules', 'dc_power_kwp']]
            
            summary_df = summary_df.rename(columns={
                'azimuth_name': 'Azimuth',
                'mppts_allocated': 'MPPTs',
                'standard_string_length': 'Modules/String',
                'standard_strings': 'Strings',
                'additional_string_length': 'Additional String Length',
                'additional_strings': 'Additional Strings',
                'modules_used': 'Modules Used',
                'remaining_modules': 'Unused Modules',
                'dc_power_kwp': 'DC Power (kWp)'
            })
            
            summary_df['DC Power (kWp)'] = summary_df['DC Power (kWp)'].round(2)
            
            # Display summary
            st.markdown("<h3 class='subsection-header'>String Configuration Summary</h3>", unsafe_allow_html=True)
            st.dataframe(summary_df, use_container_width=True)
            
            # Calculate totals
            total_modules_used = summary_df['Modules Used'].sum()
            total_modules_unused = summary_df['Unused Modules'].sum()
            total_strings = (summary_df['Strings'] + summary_df['Additional Strings']).sum()
            total_mppts_used = summary_df['MPPTs'].sum()
            total_dc_power_used = summary_df['DC Power (kWp)'].sum()
            
            st.markdown("<div class='results-container'>", unsafe_allow_html=True)
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"Total Modules Used: {total_modules_used} of {total_modules}")
                st.write(f"Total Strings: {total_strings}")
                st.write(f"Total MPPTs Used: {total_mppts_used} of {total_mppts}")
            
            with col2:
                dc_ac_ratio_final = total_dc_power_used / total_ac_power if total_ac_power > 0 else 0
                st.write(f"Total DC Power: {total_dc_power_used:.2f} kWp")
                st.write(f"Final DC/AC Ratio: {dc_ac_ratio_final:.3f}")
                
                utilization_rate = total_modules_used / total_modules * 100 if total_modules > 0 else 0
                st.write(f"Module Utilization: {utilization_rate:.2f}%")
            
            if total_modules_unused > 0:
                st.markdown(f"<div class='warning-message'>WARNING: {total_modules_unused} modules ({total_modules_unused / total_modules * 100:.2f}%) remain unused in the current configuration.</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div class='success-message'>SUCCESS: All modules have been allocated to strings.</div>", unsafe_allow_html=True)
            
            st.markdown("</div>", unsafe_allow_html=True)
            
            # Detailed MPPT allocation
            st.markdown("<h3 class='subsection-header'>Detailed MPPT Allocation</h3>", unsafe_allow_html=True)
            
            mppt_allocation = []
            inverter_count_needed = int(np.ceil(total_mppts_used / inverter_mppt_count))
            
            mppt_counter = 0
            for i in range(inverter_count_needed):
                for j in range(inverter_mppt_count):
                    if mppt_counter < total_mppts_used:
                        # Find which azimuth this MPPT belongs to
                        mppt_sum = 0
                        azimuth_for_mppt = None
                        
                        for idx, row in string_config_df.iterrows():
                            mppt_sum += row['mppts_allocated']
                            if mppt_counter < mppt_sum:
                                azimuth_for_mppt = row['azimuth_name']
                                break
                        
                        if azimuth_for_mppt:
                            # Calculate how many strings for this specific MPPT
                            azimuth_data = string_config_df[string_config_df['azimuth_name'] == azimuth_for_mppt].iloc[0]
                            strings_per_mppt = min(max_strings_per_mppt, azimuth_data['total_strings'] / azimuth_data['mppts_allocated'])
                            
                            mppt_allocation.append({
                                'inverter': i + 1,
                                'mppt': j + 1,
                                'azimuth': azimuth_for_mppt,
                                'strings': int(strings_per_mppt),
                                'modules_per_string': azimuth_data['standard_string_length'],
                                'dc_power': azimuth_data['standard_string_length'] * strings_per_mppt * module_power / 1000
                            })
                            
                            mppt_counter += 1
            
            mppt_df = pd.DataFrame(mppt_allocation)
            mppt_df = mppt_df.rename(columns={
                'inverter': 'Inverter #',
                'mppt': 'MPPT #',
                'azimuth': 'Azimuth',
                'strings': 'Strings',
                'modules_per_string': 'Modules/String',
                'dc_power': 'DC Power (kWp)'
            })
            
            mppt_df['DC Power (kWp)'] = mppt_df['DC Power (kWp)'].round(2)
            
            st.dataframe(mppt_df, use_container_width=True)
            
            # Create MPPT visualization
            st.markdown("<h3 class='subsection-header'>MPPT Allocation Visualization</h3>", unsafe_allow_html=True)
            
            # Group by inverter
            inverter_groups = mppt_df.groupby('Inverter #')
            
            for inv_num, inv_group in inverter_groups:
                st.markdown(f"<h4>Inverter #{inv_num}</h4>", unsafe_allow_html=True)
                
                # Create columns for MPPTs
                mppt_cols = st.columns(inv_group.shape[0])
                
                for i, (_, mppt_row) in enumerate(inv_group.iterrows()):
                    with mppt_cols[i]:
                        st.markdown(
                            f"""
                            <div style="border:1px solid #ddd; padding:10px; border-radius:5px; background-color:#f9f9f9;">
                              <div style="font-weight:bold; text-align:center; color:#0D47A1;">MPPT #{mppt_row['MPPT #']}</div>
                              <hr style="margin:5px 0;">
                              <div>Azimuth: {mppt_row['Azimuth']}</div>
                              <div>Strings: {mppt_row['Strings']}</div>
                              <div>Modules/String: {mppt_row['Modules/String']}</div>
                              <div style="font-weight:bold;">DC Power: {mppt_row['DC Power (kWp)']:.2f} kWp</div>
                            </div>
                            """, 
                            unsafe_allow_html=True
                        )
            
            # Voltage check
            st.markdown("<h3 class='subsection-header'>Electrical Verification</h3>", unsafe_allow_html=True)
            
            # Check string voltages against inverter limits
            voltage_checks = []
            
            for idx, row in string_config_df.iterrows():
                voltage_checks.append({
                    'azimuth': row['azimuth_name'],
                    'string_length': row['standard_string_length'],
                    'voc_min_temp': row['voc_at_min_temp'],
                    'vmp_max_temp': row['vmp_at_max_temp'],
                    'voc_limit': inverter_max_voltage,
                    'vmp_min_limit': inverter_min_voltage,
                    'voc_within_limit': row['voc_at_min_temp'] <= inverter_max_voltage,
                    'vmp_within_limit': row['vmp_at_max_temp'] >= inverter_min_voltage
                })
                
                # Add check for any additional string with different length
                if row['additional_strings'] > 0:
                    voc_at_min_temp_additional = voc_at_min_temp * row['additional_string_length']
                    vmp_at_max_temp_additional = vmp_at_max_temp * row['additional_string_length']
                    
                    voltage_checks.append({
                        'azimuth': f"{row['azimuth_name']} (Additional)",
                        'string_length': row['additional_string_length'],
                        'voc_min_temp': voc_at_min_temp_additional,
                        'vmp_max_temp': vmp_at_max_temp_additional,
                        'voc_limit': inverter_max_voltage,
                        'vmp_min_limit': inverter_min_voltage,
                        'voc_within_limit': voc_at_min_temp_additional <= inverter_max_voltage,
                        'vmp_within_limit': vmp_at_max_temp_additional >= inverter_min_voltage
                    })
            
            voltage_check_df = pd.DataFrame(voltage_checks)
            voltage_check_df = voltage_check_df.rename(columns={
                'azimuth': 'Azimuth',
                'string_length': 'Modules/String',
                'voc_min_temp': 'Voc at Min Temp (V)',
                'vmp_max_temp': 'Vmp at Max Temp (V)',
                'voc_limit': 'Max Voltage Limit (V)',
                'vmp_min_limit': 'Min MPPT Voltage (V)',
                'voc_within_limit': 'Voc within Limit',
                'vmp_within_limit': 'Vmp within Limit'
            })
            
            # Format for display
            voltage_check_df['Voc at Min Temp (V)'] = voltage_check_df['Voc at Min Temp (V)'].round(2)
            voltage_check_df['Vmp at Max Temp (V)'] = voltage_check_df['Vmp at Max Temp (V)'].round(2)
            
            # Style the dataframe to highlight issues
            def highlight_issues(val):
                if isinstance(val, bool):
                    return 'background-color: #EDF7ED' if val else 'background-color: #FFEBEE'
                return ''
            
            st.dataframe(voltage_check_df.style.applymap(highlight_issues, subset=['Voc within Limit', 'Vmp within Limit']), 
                       use_container_width=True)
            
            # Check for voltage issues
            if not voltage_check_df['Voc within Limit'].all():
                st.markdown("<div class='error-message'>WARNING: Some strings exceed the maximum inverter voltage limit at minimum temperature!</div>", unsafe_allow_html=True)
            
            if not voltage_check_df['Vmp within Limit'].all():
                st.markdown("<div class='error-message'>WARNING: Some strings fall below the minimum MPPT voltage at maximum temperature!</div>", unsafe_allow_html=True)
            
            if voltage_check_df['Voc within Limit'].all() and voltage_check_df['Vmp within Limit'].all():
                st.markdown("<div class='success-message'>SUCCESS: All string voltages are within inverter limits under all temperature conditions.</div>", unsafe_allow_html=True)
            
            # Current check
            st.markdown("<h4>Current Verification</h4>", unsafe_allow_html=True)
            
            # Maximum current per string
            isc_at_max_temp = module_isc * (1 + isc_temp_coef * (max_module_temp - 25))
            
            # Check MPPT current limits
            current_checks = []
            
            for _, row in mppt_df.iterrows():
                strings_per_mppt = row['Strings']
                total_current = strings_per_mppt * isc_at_max_temp
                
                current_checks.append({
                    'inverter': row['Inverter #'],
                    'mppt': row['MPPT #'],
                    'strings': strings_per_mppt,
                    'isc_per_string': isc_at_max_temp,
                    'total_isc': total_current,
                    'mppt_current_limit': inverter_max_mppt_current,
                    'within_limit': total_current <= inverter_max_mppt_current
                })
            
            current_check_df = pd.DataFrame(current_checks)
            current_check_df = current_check_df.rename(columns={
                'inverter': 'Inverter #',
                'mppt': 'MPPT #',
                'strings': 'Strings',
                'isc_per_string': 'Isc/String at Max Temp (A)',
                'total_isc': 'Total MPPT Isc (A)',
                'mppt_current_limit': 'MPPT Current Limit (A)',
                'within_limit': 'Within Limit'
            })
            
            # Format for display
            current_check_df['Isc/String at Max Temp (A)'] = current_check_df['Isc/String at Max Temp (A)'].round(2)
            current_check_df['Total MPPT Isc (A)'] = current_check_df['Total MPPT Isc (A)'].round(2)
            
            # Style the dataframe
            st.dataframe(current_check_df.style.applymap(highlight_issues, subset=['Within Limit']), 
                       use_container_width=True)
            
            # Check for current issues
            if not current_check_df['Within Limit'].all():
                st.markdown("<div class='error-message'>WARNING: Some MPPTs exceed the maximum current limit at maximum temperature!</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div class='success-message'>SUCCESS: All MPPT currents are within limits under all temperature conditions.</div>", unsafe_allow_html=True)
            
            # Generate download link for the report
            st.markdown("<h3 class='subsection-header'>Export Results</h3>", unsafe_allow_html=True)
            
            # Create Excel report
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Project info
                project_info_df = pd.DataFrame({
                    'Parameter': ['Project Name', 'Location', 'Target Capacity (kWp)', 'Target DC/AC Ratio',
                                'Min Ambient Temp (°C)', 'Max Ambient Temp (°C)', 'Min Module Temp (°C)', 'Max Module Temp (°C)'],
                    'Value': [project_name, project_location, project_capacity, target_dc_ac_ratio,
                            min_ambient_temp, max_ambient_temp, min_module_temp, max_module_temp]
                })
                project_info_df.to_excel(writer, sheet_name='Project Info', index=False)
                
                # Module & Inverter specs
                module_specs_df = pd.DataFrame({
                    'Parameter': ['Manufacturer', 'Model', 'Power (Wp)', 'Voc (V)', 'Vmp (V)', 'Isc (A)', 'Imp (A)',
                                'Voc Temp Coef (%/°C)', 'Vmp Temp Coef (%/°C)', 'Isc Temp Coef (%/°C)'],
                    'Value': [module_manufacturer, module_model, module_power, module_voc, module_vmp, module_isc, module_imp,
                            voc_temp_coef*100, vmp_temp_coef*100, isc_temp_coef*100]
                })
                module_specs_df.to_excel(writer, sheet_name='Module Specs', index=False)
                
                inverter_specs_df = pd.DataFrame({
                    'Parameter': ['Manufacturer', 'Model', 'Count', 'AC Power (kW)', 'Max DC Power (kW)', 'MPPT Count',
                                'Min MPPT Voltage (V)', 'Max DC Voltage (V)', 'Max MPPT Current (A)', 'String Inputs per MPPT'],
                    'Value': [inverter_manufacturer, inverter_model, inverter_count, inverter_ac_power, inverter_max_dc_power, 
                            inverter_mppt_count, inverter_min_voltage, inverter_max_voltage, inverter_max_mppt_current, 
                            inverter_string_inputs_per_mppt]
                })
                inverter_specs_df.to_excel(writer, sheet_name='Inverter Specs', index=False)
                
                # Azimuth configuration
                display_df.to_excel(writer, sheet_name='Azimuth Config', index=False)
                
                # String configuration
                summary_df.to_excel(writer, sheet_name='String Config', index=False)
                
                # MPPT allocation
                mppt_df.to_excel(writer, sheet_name='MPPT Allocation', index=False)
                
                # Voltage checks
                voltage_check_df.to_excel(writer, sheet_name='Voltage Checks', index=False)
                
                # Current checks
                current_check_df.to_excel(writer, sheet_name='Current Checks', index=False)
                
                # System summary
                system_summary_df = pd.DataFrame({
                    'Parameter': ['Total Modules', 'Modules Used', 'Unused Modules', 'Total Strings', 
                                'MPPTs Used', 'Total MPPTs', 'DC Power (kWp)', 'AC Power (kW)', 'DC/AC Ratio', 
                                'Module Utilization (%)'],
                    'Value': [total_modules, total_modules_used, total_modules_unused, total_strings, 
                            total_mppts_used, total_mppts, total_dc_power_used, total_ac_power, dc_ac_ratio_final,
                            utilization_rate]
                })
                system_summary_df.to_excel(writer, sheet_name='System Summary', index=False)
            
            output.seek(0)
            
            # Generate download link
            b64 = base64.b64encode(output.read()).decode()
            href = f'<a href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,{b64}" download="{project_name.replace(" ", "_")}_String_Sizing.xlsx" class="btn" style="background-color:#1E88E5; color:white; padding:0.5rem 1rem; text-decoration:none; border-radius:4px; margin:1rem 0; display:inline-block;">Download Excel Report</a>'
            st.markdown(href, unsafe_allow_html=True)

# System Summary Tab
with tabs[4]:
    st.markdown("<h2 class='section-header'>System Summary</h2>", unsafe_allow_html=True)
    
    if 'string_config_df' in locals():
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("<h3 class='subsection-header'>Project Information</h3>", unsafe_allow_html=True)
            st.write(f"**Project Name:** {project_name}")
            st.write(f"**Location:** {project_location}")
            st.write(f"**Target Capacity:** {project_capacity} kWp")
            st.write(f"**Target DC/AC Ratio:** {target_dc_ac_ratio}")
            
            st.markdown("<h3 class='subsection-header'>Module & Inverter</h3>", unsafe_allow_html=True)
            st.write(f"**Module:** {module_manufacturer} {module_model} ({module_power} Wp)")
            st.write(f"**Inverter:** {inverter_manufacturer} {inverter_model}")
            st.write(f"**Inverter Count:** {inverter_count}")
            st.write(f"**MPPTs per Inverter:** {inverter_mppt_count}")
        
        with col2:
            st.markdown("<h3 class='subsection-header'>Final Configuration</h3>", unsafe_allow_html=True)
            st.write(f"**Total Modules Used:** {total_modules_used} of {total_modules}")
            st.write(f"**Total Strings:** {total_strings}")
            st.write(f"**MPPTs Used:** {total_mppts_used} of {total_mppts}")
            st.write(f"**Final DC Power:** {total_dc_power_used:.2f} kWp")
            st.write(f"**Final AC Power:** {total_ac_power:.2f} kW")
            st.write(f"**Final DC/AC Ratio:** {dc_ac_ratio_final:.3f}")
            st.write(f"**Module Utilization:** {utilization_rate:.2f}%")
            
            if total_modules_unused > 0:
                st.warning(f"{total_modules_unused} modules ({total_modules_unused / total_modules * 100:.2f}%) remain unused")
        
        # System diagram visualization
        st.markdown("<h3 class='subsection-header'>System Diagram</h3>", unsafe_allow_html=True)
        
        # Create a visual representation of the system
        fig = go.Figure()
        
        # Define positions
        azimuth_colors = px.colors.qualitative.Set3[:len(azimuth_df)]
        azimuth_color_map = {row['name']: azimuth_colors[i] for i, (_, row) in enumerate(azimuth_df.iterrows())}
        
        # Create a Sankey diagram to visualize the flow from azimuth to inverters
        labels = []
        sources = []
        targets = []
        values = []
        colors = []
        
        # Add azimuth nodes
        for i, (_, row) in enumerate(sorted_azimuths.iterrows()):
            labels.append(f"{row['name']} ({row['modules']} modules)")
            colors.append(azimuth_color_map[row['name']])
        
        # Add MPPT nodes
        mppt_start_idx = len(labels)
        inverter_mppt_df = mppt_df.copy()
        for i, (_, row) in enumerate(inverter_mppt_df.iterrows()):
            labels.append(f"Inv {row['Inverter #']} MPPT {row['MPPT #']}")
            colors.append("lightgrey")
        
        # Add inverter nodes
        inverter_start_idx = len(labels)
        for i in range(1, inverter_count_needed + 1):
            labels.append(f"Inverter {i}")
            colors.append("lightblue")
        
        # Create links from azimuths to MPPTs
        for i, (_, row) in enumerate(inverter_mppt_df.iterrows()):
            # Find the azimuth index
            azimuth_idx = sorted_azimuths[sorted_azimuths['name'] == row['Azimuth']].index[0]
            sources.append(azimuth_idx)
            targets.append(mppt_start_idx + i)
            values.append(row['Strings'] * row['Modules/String'])
        
        # Create links from MPPTs to Inverters
        for i, (_, row) in enumerate(inverter_mppt_df.iterrows()):
            sources.append(mppt_start_idx + i)
            targets.append(inverter_start_idx + row['Inverter #'] - 1)
            values.append(row['DC Power (kWp)'] * 10)  # Scale for better visualization
        
        # Create the Sankey diagram
        fig = go.Figure(data=[go.Sankey(
            node=dict(
                pad=15,
                thickness=20,
                line=dict(color="black", width=0.5),
                label=labels,
                color=colors
            ),
            link=dict(
                source=sources,
                target=targets,
                value=values
            )
        )])
        
        fig.update_layout(title_text="System Power Flow Diagram", font_size=12, height=600)
        st.plotly_chart(fig, use_container_width=True)
        
        # String distribution visualization
        st.markdown("<h3 class='subsection-header'>String Distribution</h3>", unsafe_allow_html=True)
        
        string_dist = []
        for _, row in string_config_df.iterrows():
            # Add standard strings
            for _ in range(row['standard_strings']):
                string_dist.append({
                    'Azimuth': row['azimuth_name'],
                    'String Length': row['standard_string_length'],
                    'Type': 'Standard'
                })
            
            # Add additional strings
            for _ in range(row['additional_strings']):
                string_dist.append({
                    'Azimuth': row['azimuth_name'],
                    'String Length': row['additional_string_length'],
                    'Type': 'Additional'
                })
        
        string_dist_df = pd.DataFrame(string_dist)
        
        if not string_dist_df.empty:
            fig = px.histogram(string_dist_df, x='String Length', color='Azimuth', 
                             barmode='group', title='String Length Distribution')
            st.plotly_chart(fig, use_container_width=True)
        
        # MPPT utilization chart
        total_mppts = inverter_count * inverter_mppt_count
        mppt_utilization = total_mppts_used / total_mppts * 100 if total_mppts > 0 else 0
        
        mppt_util_data = pd.DataFrame([
            {'Status': 'Used', 'Count': total_mppts_used},
            {'Status': 'Unused', 'Count': total_mppts - total_mppts_used}
        ])
        
        if total_mppts > 0:
            fig = px.pie(mppt_util_data, values='Count', names='Status', 
                      title=f'MPPT Utilization ({mppt_utilization:.1f}%)',
                      color='Status', color_discrete_map={'Used': '#1E88E5', 'Unused': '#CFD8DC'})
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Please go to the 'String Sizing Results' tab and click 'Calculate String Configuration' to see the system summary.")

# Add footer
st.markdown("""
<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
<p>Solar PV String Sizing Tool - Designed according to IEC standards</p>
</div>
""", unsafe_allow_html=True)
