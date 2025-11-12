import pandas as pd

# 1. Ambient Temperature Derating for XLPE Copper 3-Core and 4-Core Cables
DERATE_AMBIENT_TEMP_CU_MC = {
    10: 1.15,
    15: 1.12,
    20: 1.08,
    25: 1.04,
    30: 1.00,
    35: 0.96,
    40: 0.91,
    45: 0.87,
    50: 0.82,
    55: 0.76,
    60: 0.71,
    65: 0.65,
    70: 0.58,
    75: 0.50,
    80: 0.41
}

# 2. Grouping Derating for Multicore Cables (3-Core and 4-Core)
# Touching Cables on Surfaces or Cable Trays
DERATE_GROUP_SURFACE_CU_MC = {
    1: 1.00,
    2: 0.85,
    3: 0.78,
    4: 0.73,
    5: 0.70,
    6: 0.68,
    7: 0.66,
    8: 0.64,
    9: 0.63,
    12: 0.61,
    16: 0.58,
    20: 0.57
}

# In Conduits or Enclosed Spaces
DERATE_GROUP_CONDUIT_CU_MC = {
    1: 1.00,
    2: 0.80,
    3: 0.70,
    4: 0.65,
    5: 0.60,
    6: 0.57,
    7: 0.54,
    8: 0.52,
    9: 0.50,
    12: 0.45,
    16: 0.41,
    20: 0.38
}

# 3. Thermal Insulation Derating for XLPE Copper Cables
DERATE_THERMAL_INSULATION_CU_MC = {
    "No thermal insulation": 1.00,
    "Totally surrounded by thermal insulation": 0.55,
    "Partially surrounded by thermal insulation": 0.78,
    "Single cable embedded in wall": 0.90
}

# 4. Soil Thermal Resistivity Derating for Buried XLPE Copper Cables
DERATE_SOIL_RHO_CU_MC = {
    1.0: 1.22,  # Wet soil
    1.5: 1.10,  # Damp soil
    2.5: 1.00,  # Standard reference condition
    3.0: 0.93,  # Dry soil
    5.0: 0.73   # Very dry soil
}

# 5. Depth of Burial Derating for XLPE Copper Cables
DERATE_DEPTH_CU_MC = {
    0.5: 1.04,
    0.7: 1.00,
    0.9: 0.97,
    1.0: 0.96,
    1.2: 0.93,
    1.5: 0.90,
    2.0: 0.87
}

# 6. Harmonics Derating for 3-Core and 4-Core XLPE Copper Cables
DERATE_HARMONICS_CU_MC = {
    "Normal (< 10% 3rd harmonic)": 1.00,
    "10-15% 3rd harmonic": 0.94,
    "15-33% 3rd harmonic": 0.86,
    "> 33% 3rd harmonic (neutral carries current)": 0.80
}

# 7. Installation Method Base Current Rating Examples for XLPE Copper Multicore Cables
# (3 or 4 loaded conductors) at 30°C ambient temperature
DB_AMPACITY_CU_MC = {
    "Cable Size(mm²)": [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240],
    "Clipped Direct(A)": [22, 30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328, 379, 434, 514],
    "In Conduit on Wall(A)": [18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430],
    "In Buried Conduit(A)": [22, 29, 38, 47, 63, 81, 104, 125, 148, 183, 216, 246, 278, 312, 361],
    "Direct Burial(A)": [24, 32, 42, 53, 70, 91, 116, 140, 166, 204, 241, 275, 310, 348, 402]
}

# Convert to DataFrame
db_ampacity_cu_mc = pd.DataFrame(DB_AMPACITY_CU_MC)

db_ampacity_cu_mc = db_ampacity_cu_mc.set_index('Cable Size(mm²)')

#----------------------------------

# Ambient Temperature Derating for Aluminum Multi-core Cables
DERATE_AMBIENT_TEMP_AL_MC = {
    10: 1.15,
    15: 1.12,
    20: 1.08,
    25: 1.04,
    30: 1.00,
    35: 0.96,
    40: 0.91,
    45: 0.87,
    50: 0.82,
    55: 0.76,
    60: 0.71,
    65: 0.65,
    70: 0.58,
    75: 0.50,
    80: 0.41
}

# Grouping Derating for Multicore Cables (Touching on Surfaces or Cable Trays)
DERATE_GROUP_AIR_TOUCH_AL_MC = {
    1: 1.00,
    2: 0.85,
    3: 0.78,
    4: 0.73,
    5: 0.70,
    6: 0.68,
    7: 0.66,
    8: 0.64,
    9: 0.63,
    12: 0.61,
    16: 0.58,
    20: 0.57
}

# Grouping Derating for Multicore Cables (In Conduits or Enclosed Spaces)
DERATE_GROUP_CONDUIT_AL_MC = {
    1: 1.00,
    2: 0.80,
    3: 0.70,
    4: 0.65,
    5: 0.60,
    6: 0.57,
    7: 0.54,
    8: 0.52,
    9: 0.50,
    12: 0.45,
    16: 0.41,
    20: 0.38
}

# Thermal Insulation Derating for Aluminum Multi-core Cables
DERATE_THERMAL_INSULATION_AL_MC = {
    "No thermal insulation": 1.00,
    "Totally surrounded by thermal insulation": 0.55,
    "Partially surrounded by thermal insulation": 0.78,
    "Single cable embedded in wall": 0.90
}

# Soil Thermal Resistivity Derating for Buried Aluminum Multi-core Cables
DERATE_SOIL_RHO_AL_MC = {
    1.0: 1.22,  # Wet soil
    1.5: 1.10,  # Damp soil
    2.5: 1.00,  # Standard reference condition
    3.0: 0.93,  # Dry soil
    5.0: 0.73   # Very dry soil
}

# Depth of Burial Derating for Aluminum Multi-core Cables
DERATE_DEPTH_AL_MC = {
    0.5: 1.04,
    0.7: 1.00,
    0.9: 0.97,
    1.0: 0.96,
    1.2: 0.93,
    1.5: 0.90,
    2.0: 0.87
}

# Harmonics Derating for 3-Core and 4-Core Aluminum Multi-core Cables
DERATE_HARMONICS_AL_MC = {
    "Normal (< 10% 3rd harmonic)": 1.00,
    "10-15% 3rd harmonic": 0.94,
    "15-33% 3rd harmonic": 0.86,
    "> 33% 3rd harmonic (neutral carries current)": 0.80
}

# Installation Method Base Current Rating for Aluminum Multi-core Cables
DB_AMPACITY_AL_MC = {
    'Cable Size(mm²)': [2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0, 150.0, 185.0, 240.0, 300.0],
    'Clipped Direct(A)': [23, 31, 39, 54, 73, 93, 114, 140, 179, 217, 253, 292, 335, 396, 456],
    'In Conduit on Wall(A)': [19, 26, 33, 46, 62, 79, 97, 118, 151, 183, 212, 245, 280, 330, 381],
    'In Buried Conduit(A)': [22, 29, 36, 49, 63, 81, 97, 115, 142, 167, 190, 215, 241, 280, 317],
    'Direct Burial(A)': [24, 32, 41, 54, 71, 90, 108, 129, 158, 187, 213, 240, 270, 312, 352]
}

# Convert DB_AMPACITY_AL_MC to DataFrame
db_ampacity_al_mc = pd.DataFrame(DB_AMPACITY_AL_MC)
db_ampacity_al_mc = db_ampacity_al_mc.set_index('Cable Size(mm²)')

#----------------------------------

# 1.1 Copper Single-Core XLPE Cables
DERATE_AMBIENT_TEMP_CU_SC = {
    10: 1.16, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00,
    35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.77,
    60: 0.71, 65: 0.65, 70: 0.58, 75: 0.50, 80: 0.41
}

# 1.2 Aluminum Single-Core XLPE Cables
DERATE_AMBIENT_TEMP_AL_SC = {
    10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00,
    35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76,
    60: 0.71, 65: 0.65, 70: 0.58, 75: 0.50, 80: 0.41
}

# 2.1.1 Copper Single-Core XLPE Cables (Touching in Horizontal Formation)
DERATE_GROUP_AIR_TOUCH_CU_SC = {
    1: 1.00, 2: 0.88, 3: 0.82, 4: 0.79, 5: 0.76,
    6: 0.73, 7: 0.73, 8: 0.72, 9: 0.72, 12: 0.70,
    16: 0.69, 20: 0.68
}

# 2.1.2 Aluminum Single-Core XLPE Cables (Touching in Horizontal Formation)
DERATE_GROUP_AIR_TOUCH_AL_SC = {
    1: 1.00, 2: 0.87, 3: 0.82, 4: 0.80, 5: 0.80,
    6: 0.79, 7: 0.79, 8: 0.78, 9: 0.78, 12: 0.76,
    16: 0.75, 20: 0.74
}

# 2.2.1 Copper Single-Core XLPE Cables (Spaced)
DERATE_GROUP_AIR_SPACED_CU_SC = {
    1: 1.00, 2: 1.00, 3: 0.98, 4: 0.95, 5: 0.94,
    6: 0.93, 7: 0.91, 8: 0.90, 9: 0.90, 12: 0.89,
    16: 0.87, 20: 0.86
}

# 2.2.2 Aluminum Single-Core XLPE Cables (Spaced)
DERATE_GROUP_AIR_SPACED_AL_SC = {
    1: 1.00, 2: 1.00, 3: 0.98, 4: 0.95, 5: 0.93,
    6: 0.92, 7: 0.90, 8: 0.90, 9: 0.90, 12: 0.88,
    16: 0.86, 20: 0.85
}

# 2.3.1 Copper Single-Core XLPE Cables (in Conduits)
DERATE_GROUP_CONDUIT_CU_SC = {
    1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60,
    6: 0.57, 7: 0.54, 8: 0.52, 9: 0.50, 12: 0.45,
    16: 0.41, 20: 0.38
}

# 2.3.2 Aluminum Single-Core XLPE Cables (in Conduits)
DERATE_GROUP_CONDUIT_AL_SC = {
    1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60,
    6: 0.57, 7: 0.54, 8: 0.52, 9: 0.50, 12: 0.45,
    16: 0.41, 20: 0.38
}

# 3.1 Copper Single-Core XLPE Cables
DERATE_THERMAL_INSULATION_CU_SC = {
    "No thermal insulation": 1.00,
    "Totally surrounded by thermal insulation": 0.50,
    "Partially surrounded by thermal insulation": 0.75,
    "Single cable embedded in wall": 0.95,
    "Cable crossing thermal insulation": 0.90
}

# 3.2 Aluminum Single-Core XLPE Cables
DERATE_THERMAL_INSULATION_AL_SC = {
    "No thermal insulation": 1.00,
    "Totally surrounded by thermal insulation": 0.50,
    "Partially surrounded by thermal insulation": 0.75,
    "Single cable embedded in wall": 0.95,
    "Cable crossing thermal insulation": 0.90
}

# 4.1 Copper Single-Core XLPE Cables
DERATE_SOIL_RHO_CU_SC = {
    0.5: 1.37,  # Very wet soil
    1.0: 1.26,  # Wet soil
    1.5: 1.13,  # Damp soil
    2.0: 1.05,  # Dry sandy soil
    2.5: 1.00,  # Standard reference condition
    3.0: 0.93,  # Dry soil
    4.0: 0.82,  # Very dry soil
    5.0: 0.73   # Extremely dry soil
}

# 4.2 Aluminum Single-Core XLPE Cables
DERATE_SOIL_RHO_AL_SC = {
    0.5: 1.38,  # Very wet soil
    1.0: 1.27,  # Wet soil
    1.5: 1.14,  # Damp soil
    2.0: 1.06,  # Dry sandy soil
    2.5: 1.00,  # Standard reference condition
    3.0: 0.92,  # Dry soil
    4.0: 0.81,  # Very dry soil
    5.0: 0.71   # Extremely dry soil
}

# 5.1 Copper Single-Core XLPE Cables
DERATE_DEPTH_CU_SC = {
    0.4: 1.08,
    0.5: 1.06,
    0.6: 1.03,
    0.7: 1.00,
    0.8: 0.98,
    0.9: 0.96,
    1.0: 0.94,
    1.2: 0.90,
    1.5: 0.87,
    2.0: 0.84,
    2.5: 0.80,
    3.0: 0.77
}

# 5.2 Aluminum Single-Core XLPE Cables
DERATE_DEPTH_AL_SC = {
    0.4: 1.09,
    0.5: 1.07,
    0.6: 1.04,
    0.7: 1.00,
    0.8: 0.97,
    0.9: 0.95,
    1.0: 0.93,
    1.2: 0.89,
    1.5: 0.86,
    2.0: 0.83,
    2.5: 0.79,
    3.0: 0.76
}

# 6.1 Copper Single-Core XLPE Cables
DERATE_HARMONICS_CU_SC = {
    "Trefoil formation": 1.00,
    "Flat formation with spacing ≥ 2D": 0.98,
    "Flat formation with spacing = D": 0.96,
    "Flat formation touching": 0.85,
    "Flat formation in steel conduits (separate)": 0.90,
    "Flat formation in metallic conduit (unearthed)": 0.80,
    "Flat formation in metallic conduit (earthed)": 0.65,
    "Flat formation in steel trays with lid": 0.70
}

# 6.2 Aluminum Single-Core XLPE Cables
DERATE_HARMONICS_AL_SC = {
    "Trefoil formation": 1.00,
    "Flat formation with spacing ≥ 2D": 0.98,
    "Flat formation with spacing = D": 0.96,
    "Flat formation touching": 0.84,
    "Flat formation in steel conduits (separate)": 0.90,
    "Flat formation in metallic conduit (unearthed)": 0.79,
    "Flat formation in metallic conduit (earthed)": 0.64,
    "Flat formation in steel trays with lid": 0.69
}

# 7.1 Copper Single-Core XLPE Cables in Free Air (Trefoil formation)
DB_AMPACITY_FREE_AIR_CU_SC = {
    1.5: 23,
    2.5: 32,
    4: 42,
    6: 54,
    10: 75,
    16: 100,
    25: 127,
    35: 158,
    50: 192,
    70: 246,
    95: 298,
    120: 346,
    150: 399,
    185: 456,
    240: 538,
    300: 621,
    400: 726,
    500: 830,
    630: 961,
    800: 1118,
    1000: 1264
}

# 7.2 Aluminum Single-Core XLPE Cables in Free Air (Trefoil formation)
DB_AMPACITY_FREE_AIR_AL_SC = {
    2.5: 25,
    4: 32,
    6: 41,
    10: 57,
    16: 76,
    25: 96,
    35: 119,
    50: 144,
    70: 184,
    95: 223,
    120: 261,
    150: 303,
    185: 349,
    240: 413,
    300: 477,
    400: 571,
    500: 659,
    630: 775,
    800: 899,
    1000: 1026
}

# 7.3.1 Copper Single-Core XLPE Cables Directly Buried
DB_AMPACITY_DIRECT_BURIED_CU_SC = {
    1.5: 27,
    2.5: 36,
    4: 47,
    6: 59,
    10: 80,
    16: 105,
    25: 137,
    35: 167,
    50: 202,
    70: 255,
    95: 307,
    120: 352,
    150: 404,
    185: 461,
    240: 546,
    300: 626,
    400: 733,
    500: 837,
    630: 959,
    800: 1108,
    1000: 1245
}

# 7.3.2 Aluminum Single-Core XLPE Cables Directly Buried
DB_AMPACITY_DIRECT_BURIED_AL_SC = {
    2.5: 28,
    4: 36,
    6: 45,
    10: 61,
    16: 81,
    25: 105,
    35: 129,
    50: 157,
    70: 200,
    95: 241,
    120: 278,
    150: 318,
    185: 362,
    240: 430,
    300: 493,
    400: 583,
    500: 671,
    630: 783,
    800: 912,
    1000: 1030
}

# Example for Single Core Cables Direct Buried (Trefoil, Touching)
# Using DERATE_GROUP_BURIED_CU_SC (assuming trefoil) defined elsewhere if needed
# Adding Placeholders for Spaced Buried Single Core - VERIFY VALUES WITH STANDARD (e.g., AS3008 T25(2))
DERATE_GROUP_BURIED_SPACED_CU_SC = { # Placeholder - Assumes specific spacing (e.g., 1 Cable Diameter)
    1: 1.00, 2: 0.90, 3: 0.85, 4: 0.82, 5: 0.80, 6: 0.78 # Example values ONLY
}
DERATE_GROUP_BURIED_SPACED_AL_SC = { # Placeholder - Assumes specific spacing (e.g., 1 Cable Diameter)
    1: 1.00, 2: 0.89, 3: 0.84, 4: 0.81, 5: 0.79, 6: 0.77 # Example values ONLY
}

#----------------------------------

# 1. AC Resistance (R) Values at 20°C for Copper Cables
RESISTANCE_AC_20C_CU_SOLID = {
    1.5: 12.1,
    2.5: 7.41,
    4: 4.61,
    6: 3.08,
    10: 1.83,
    16: 1.15,
    25: 0.727,
    35: 0.524,
    50: 0.387,
    70: 0.268,
    95: 0.193,
    120: 0.153,
    150: 0.124,
    185: 0.0991,
    240: 0.0754,
    300: 0.0601,
    400: 0.0470,
    500: 0.0366,
    630: 0.0283,
    800: 0.0221,
    1000: 0.0176
}

RESISTANCE_AC_20C_CU_STRANDED = {
    1.5: 12.4,
    2.5: 7.56,
    4: 4.70,
    6: 3.11,
    10: 1.84,
    16: 1.16,
    25: 0.734,
    35: 0.529,
    50: 0.391,
    70: 0.270,
    95: 0.195,
    120: 0.154,
    150: 0.126,
    185: 0.100,
    240: 0.0762,
    300: 0.0607,
    400: 0.0475,
    500: 0.0369,
    630: 0.0286,
    800: 0.0224,
    1000: 0.0177
}

# 1. AC Resistance (R) Values at 20°C for Aluminum Cables
RESISTANCE_AC_20C_AL_SOLID = {
    2.5: 12.0,
    4: 7.41,
    6: 4.61,
    10: 3.08,
    16: 1.91,
    25: 1.20,
    35: 0.868,
    50: 0.641,
    70: 0.443,
    95: 0.320,
    120: 0.253,
    150: 0.206,
    185: 0.164,
    240: 0.125,
    300: 0.100,
    400: 0.0778,
    500: 0.0605,
    630: 0.0469,
    800: 0.0367,
    1000: 0.0291
}

RESISTANCE_AC_20C_AL_STRANDED = {
    2.5: 12.4,
    4: 7.56,
    6: 4.70,
    10: 3.11,
    16: 1.91,
    25: 1.20,
    35: 0.868,
    50: 0.640,
    70: 0.443,
    95: 0.320,
    120: 0.253,
    150: 0.206,
    185: 0.164,
    240: 0.125,
    300: 0.100,
    400: 0.0778,
    500: 0.0605,
    630: 0.0469,
    800: 0.0367,
    1000: 0.0291
}

# 2. Temperature Correction for AC Resistance
TEMP_CORRECTION_CU = {
    20: 1.000,
    30: 1.039,
    40: 1.079,
    50: 1.118,
    60: 1.157,
    70: 1.196,
    80: 1.236,
    90: 1.275
}

TEMP_CORRECTION_AL = {
    20: 1.000,
    30: 1.040,
    40: 1.081,
    50: 1.121,
    60: 1.161,
    70: 1.201,
    80: 1.242,
    90: 1.282
}

TEMP_COEFFICIENT = {
    "CU": 0.00393,
    "AL": 0.00403
}

# 3. Reactance (X) Values for Single-Core Cables (Ω/km)
REACTANCE_SC_TREFOIL = {
    1.5: 0.118,
    2.5: 0.110,
    4: 0.107,
    6: 0.097,
    10: 0.092,
    16: 0.088,
    25: 0.085,
    35: 0.083,
    50: 0.081,
    70: 0.080,
    95: 0.079,
    120: 0.078,
    150: 0.078,
    185: 0.077,
    240: 0.076,
    300: 0.075,
    400: 0.075,
    500: 0.074,
    630: 0.074,
    800: 0.073,
    1000: 0.072
}

REACTANCE_SC_FLAT_TOUCHING = {
    1.5: 0.132,
    2.5: 0.123,
    4: 0.120,
    6: 0.110,
    10: 0.105,
    16: 0.100,
    25: 0.097,
    35: 0.095,
    50: 0.094,
    70: 0.092,
    95: 0.090,
    120: 0.089,
    150: 0.088,
    185: 0.087,
    240: 0.086,
    300: 0.085,
    400: 0.084,
    500: 0.083,
    630: 0.082,
    800: 0.081,
    1000: 0.080
}

REACTANCE_SC_FLAT_SPACED = {
    1.5: 0.174,
    2.5: 0.165,
    4: 0.162,
    6: 0.152,
    10: 0.147,
    16: 0.143,
    25: 0.140,
    35: 0.138,
    50: 0.136,
    70: 0.134,
    95: 0.132,
    120: 0.131,
    150: 0.130,
    185: 0.129,
    240: 0.128,
    300: 0.127,
    400: 0.126,
    500: 0.125,
    630: 0.124,
    800: 0.123,
    1000: 0.122
}

# 3. Reactance (X) Values for Multi-Core Cables (Ω/km)
REACTANCE_MC = {
    1.5: 0.104,
    2.5: 0.096,
    4: 0.093,
    6: 0.087,
    10: 0.082,
    16: 0.078,
    25: 0.075,
    35: 0.073,
    50: 0.072,
    70: 0.070,
    95: 0.069,
    120: 0.068,
    150: 0.068,
    185: 0.067,
    240: 0.066,
    300: 0.066,
    400: 0.065
}

# Additional constants from document
PV_APPLICATIONS = {
    "DC_circuits": "Only resistance value is relevant (no reactance)",
    "AC_circuits": "Both resistance and reactance contribute to voltage drop",
    "High_frequency": "Skin and proximity effects become more significant",
    "Voltage_drop": "Typically 1-3% depending on section"
}

# Convert resistance dictionaries to DataFrames
resistance_ac_20c_cu_solid = pd.DataFrame.from_dict(RESISTANCE_AC_20C_CU_SOLID, orient='index', columns=['R (Ω/km)'])
resistance_ac_20c_cu_solid.index.name = 'Cable Size(mm²)'

resistance_ac_20c_cu_stranded = pd.DataFrame.from_dict(RESISTANCE_AC_20C_CU_STRANDED, orient='index', columns=['R (Ω/km)'])
resistance_ac_20c_cu_stranded.index.name = 'Cable Size(mm²)'

resistance_ac_20c_al_solid = pd.DataFrame.from_dict(RESISTANCE_AC_20C_AL_SOLID, orient='index', columns=['R (Ω/km)'])
resistance_ac_20c_al_solid.index.name = 'Cable Size(mm²)'

resistance_ac_20c_al_stranded = pd.DataFrame.from_dict(RESISTANCE_AC_20C_AL_STRANDED, orient='index', columns=['R (Ω/km)'])
resistance_ac_20c_al_stranded.index.name = 'Cable Size(mm²)'

# Convert temperature correction dictionaries to DataFrames
temp_correction_cu = pd.DataFrame.from_dict(TEMP_CORRECTION_CU, orient='index', columns=['Correction Factor'])
temp_correction_cu.index.name = 'Temperature (°C)'

temp_correction_al = pd.DataFrame.from_dict(TEMP_CORRECTION_AL, orient='index', columns=['Correction Factor'])
temp_correction_al.index.name = 'Temperature (°C)'

# Convert reactance dictionaries to DataFrames
reactance_sc_trefoil = pd.DataFrame.from_dict(REACTANCE_SC_TREFOIL, orient='index', columns=['X (Ω/km)'])
reactance_sc_trefoil.index.name = 'Cable Size(mm²)'

reactance_sc_flat_touching = pd.DataFrame.from_dict(REACTANCE_SC_FLAT_TOUCHING, orient='index', columns=['X (Ω/km)'])
reactance_sc_flat_touching.index.name = 'Cable Size(mm²)'

reactance_sc_flat_spaced = pd.DataFrame.from_dict(REACTANCE_SC_FLAT_SPACED, orient='index', columns=['X (Ω/km)'])
reactance_sc_flat_spaced.index.name = 'Cable Size(mm²)'

reactance_mc = pd.DataFrame.from_dict(REACTANCE_MC, orient='index', columns=['X (Ω/km)'])
reactance_mc.index.name = 'Cable Size(mm²)'

# Create combined dataframes with both resistance and reactance
# For copper single-core cables
cu_sc_rn_values = resistance_ac_20c_cu_stranded.rename(columns={'R (Ω/km)': 'R at 20°C (Ω/km)'})
cu_sc_trefoil = pd.merge(cu_sc_rn_values, reactance_sc_trefoil, left_index=True, right_index=True, how='outer')
cu_sc_flat_touching = pd.merge(cu_sc_rn_values, reactance_sc_flat_touching, left_index=True, right_index=True, how='outer')
cu_sc_flat_spaced = pd.merge(cu_sc_rn_values, reactance_sc_flat_spaced, left_index=True, right_index=True, how='outer')

# For aluminum single-core cables
al_sc_rn_values = resistance_ac_20c_al_stranded.rename(columns={'R (Ω/km)': 'R at 20°C (Ω/km)'})
al_sc_trefoil = pd.merge(al_sc_rn_values, reactance_sc_trefoil, left_index=True, right_index=True, how='outer')
al_sc_flat_touching = pd.merge(al_sc_rn_values, reactance_sc_flat_touching, left_index=True, right_index=True, how='outer')
al_sc_flat_spaced = pd.merge(al_sc_rn_values, reactance_sc_flat_spaced, left_index=True, right_index=True, how='outer')

# For multi-core cables
cu_mc_rn_values = resistance_ac_20c_cu_stranded.rename(columns={'R (Ω/km)': 'R at 20°C (Ω/km)'})
cu_mc_rx = pd.merge(cu_mc_rn_values, reactance_mc, left_index=True, right_index=True, how='inner')

al_mc_rn_values = resistance_ac_20c_al_stranded.rename(columns={'R (Ω/km)': 'R at 20°C (Ω/km)'})
al_mc_rx = pd.merge(al_mc_rn_values, reactance_mc, left_index=True, right_index=True, how='inner')

# --- Derating Factors ---

# 1. Ambient Air Temperature Derating (Ka) - Base 40°C (AU), 30°C (NZ) - IEC 60364-5-52 Table B.52.14
# Assuming a base of 30°C for this example
DERATE_AMBIENT_TEMP_CU_MC = { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.80, 50: 0.71, 55: 0.61, 60: 0.50 }
DERATE_AMBIENT_TEMP_AL_MC = { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.80, 50: 0.71, 55: 0.61, 60: 0.50 }
DERATE_AMBIENT_TEMP_CU_SC = { 10: 1.16, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.77, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.50, 80: 0.41 } # Using SC specific from above
DERATE_AMBIENT_TEMP_AL_SC = { 10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.50, 80: 0.41 } # Using SC specific from above


# 2. Ground Temperature Derating (Kg) - Base 15°C (NZ), 25°C (AU) - IEC 60364-5-52 Table B.52.15
# Assuming a base of 25°C for this example data
DERATE_GROUND_TEMP_CU_MC = { 10: 1.07, 15: 1.04, 20: 1.02, 25: 1.00, 30: 0.97, 35: 0.94, 40: 0.91, 45: 0.88, 50: 0.85 } # Example values based on XLPE
DERATE_GROUND_TEMP_AL_MC = DERATE_GROUND_TEMP_CU_MC # Often same for ground temp
DERATE_GROUND_TEMP_CU_SC = { 10: 1.12, 15: 1.08, 20: 1.04, 25: 1.00, 30: 0.96, 35: 0.91, 40: 0.87, 45: 0.82, 50: 0.77 } # Example based on IEC for SC, Base 25
DERATE_GROUND_TEMP_AL_SC = DERATE_GROUND_TEMP_CU_SC # Simplified for example

# 3. Grouping Derating (Kc)
# 3a. Grouping in Air (Touching) - IEC Table B.52.17 / AS3008 Table 22
# Example for Multicore Cables in Air (Touching)
DERATE_GROUP_AIR_CU_MC = {1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.50}
DERATE_GROUP_AIR_AL_MC = DERATE_GROUP_AIR_CU_MC
# Example for Single Core Cables in Air (Trefoil, Touching)
# Using DERATE_GROUP_AIR_TOUCH_CU_SC and DERATE_GROUP_AIR_TOUCH_AL_SC defined earlier

# 3b. Grouping Underground (In Conduit/Ducts, Touching) - IEC Table B.52.19 / AS3008 Table 24
# Example for Multicore Cables in Single-Way Ducts (Touching)
DERATE_GROUP_CONDUIT_CU_MC = {1: 1.00, 2: 0.80, 3: 0.70, 4: 0.64, 5: 0.59, 6: 0.56}
DERATE_GROUP_CONDUIT_AL_MC = DERATE_GROUP_CONDUIT_CU_MC
# Example for Single Core Cables in Single-Way Ducts (Trefoil, Touching)
# Using DERATE_GROUP_CONDUIT_CU_SC and DERATE_GROUP_CONDUIT_AL_SC defined earlier

# 3c. Grouping Underground (Direct Buried, Touching) - IEC Table B.52.20 / AS3008 Table 25
# Example for Multicore Cables Direct Buried (Touching)
DERATE_GROUP_BURIED_CU_MC = {1: 1.00, 2: 0.75, 3: 0.65, 4: 0.60, 5: 0.55, 6: 0.50}
DERATE_GROUP_BURIED_AL_MC = DERATE_GROUP_BURIED_CU_MC
# Example for Single Core Cables Direct Buried (Trefoil, Touching)
# Using DERATE_GROUP_BURIED_CU_SC (assuming trefoil) defined elsewhere if needed


# 4. Thermal Insulation Derating (Ki) - IEC Table B.52.21 / AS3008 Table 26
# Using DERATE_THERMAL_INSULATION_CU_MC etc defined earlier

# 5. Soil Thermal Resistivity Derating (Krho) - Base 2.5 K.m/W - IEC Table B.52.16 / AS3008 Table 27(3)
# Using DERATE_SOIL_RHO_CU_MC etc defined earlier

# 6. Depth of Burial Derating (Kd) - Base 0.7m - AS3008 Table 28
# Using DERATE_DEPTH_CU_MC etc defined earlier

# 7. Harmonic Current Derating (Kh) - AS3008 Clause 4.4.3
# Using DERATE_HARMONICS_CU_MC etc defined earlier

# --- Base Current Ratings (Ampacity I_z) ---
# From AS/NZS 3008.1.1:2017 Tables (Examples - verify with standard)
# Assuming XLPE 90°C insulation

# DataFrames for Multicore are already set up earlier
# Dictionaries for Single Core per installation method are already set up earlier

# --- Resistance & Reactance ---
# DataFrames for Resistance, Temp Correction, Reactance are already set up earlier

# --- Combined R+X DataFrames ---
# Combined DataFrames are already set up earlier

# --- Other Constants/Data ---
# Example PV specific constants (if needed)
PV_CONSTANTS = {
    "Insolation": "1000 W/m² (STC)",
    "Cell_Temp_Correction": "-0.4 %/°C",
    "Standard_Voltage_Drop": "Max 1% for DC section",
    "Voltage_drop": "Typically 1-3% depending on section"
}

# Convert Single-Core Ampacity Dictionaries to Pandas Series

# 7.1 Copper Single-Core XLPE Cables in Free Air (Trefoil formation)
db_ampacity_free_air_cu_sc = pd.Series(DB_AMPACITY_FREE_AIR_CU_SC)
db_ampacity_free_air_cu_sc.index.name = 'Cable Size(mm²)'
db_ampacity_free_air_cu_sc.name = 'Free Air (Trefoil)(A)'

# 7.2 Aluminum Single-Core XLPE Cables in Free Air (Trefoil formation)
db_ampacity_free_air_al_sc = pd.Series(DB_AMPACITY_FREE_AIR_AL_SC)
db_ampacity_free_air_al_sc.index.name = 'Cable Size(mm²)'
db_ampacity_free_air_al_sc.name = 'Free Air (Trefoil)(A)'

# 7.3.1 Copper Single-Core XLPE Cables Directly Buried
db_ampacity_direct_buried_cu_sc = pd.Series(DB_AMPACITY_DIRECT_BURIED_CU_SC)
db_ampacity_direct_buried_cu_sc.index.name = 'Cable Size(mm²)'
db_ampacity_direct_buried_cu_sc.name = 'Direct Burial (Trefoil)(A)' # Assumed Trefoil

# 7.3.2 Aluminum Single-Core XLPE Cables Directly Buried
db_ampacity_direct_buried_al_sc = pd.Series(DB_AMPACITY_DIRECT_BURIED_AL_SC)
db_ampacity_direct_buried_al_sc.index.name = 'Cable Size(mm²)'
db_ampacity_direct_buried_al_sc.name = 'Direct Burial (Trefoil)(A)' # Assumed Trefoil


# --- Resistance & Reactance ---
# ... existing code ...
    


