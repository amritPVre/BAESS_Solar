# Python dictionaries for XLPE Single-Core Aluminum Cable data

# Base ampacity ratings for in-ground installation
ampacity_ground_11kv = {
    35: 148,
    50: 173,
    70: 208,
    95: 243,
    120: 273,
    150: 303,
    185: 338,
    240: 393,
    300: 438,
    400: 500,
    500: 560,
    630: 625,
    800: 688,
    1000: 755
}

# Base ampacity ratings for in-air installation
ampacity_air_11kv = {
    35: 168,
    50: 203,
    70: 248,
    95: 298,
    120: 333,
    150: 373,
    185: 423,
    240: 493,
    300: 558,
    400: 643,
    500: 723,
    630: 815,
    800: 908,
    1000: 998
}

# Derating factors for ambient air temperature (for cables in air)
derating_ambient_temp = {
    15: 1.12,
    20: 1.08,
    25: 1.04,
    30: 1.00,  # base
    35: 0.96,
    40: 0.91,
    45: 0.87,
    50: 0.82,
    55: 0.76,
    60: 0.71
}

# Derating factors for ground temperature (for buried cables)
derating_ground_temp = {
    10: 1.10,
    15: 1.05,
    20: 1.00,  # base
    25: 0.95,
    30: 0.89,
    35: 0.84,
    40: 0.77,
    45: 0.71,
    50: 0.63
}

# Derating factors for soil thermal resistivity
derating_soil_resistivity = {
    0.5: 1.21,
    0.7: 1.13,
    0.8: 1.10,
    1.0: 1.00,  # base
    1.2: 0.93,
    1.5: 0.84,
    2.0: 0.74,
    2.5: 0.67,
    3.0: 0.61,
    3.5: 0.57
}

# Derating factors for depth of burial
derating_burial_depth = {
    0.5: 1.08,
    0.7: 1.04,
    0.9: 1.01,
    1.0: 1.00,  # base
    1.25: 0.98,
    1.5: 0.95,
    2.0: 0.90,
    2.5: 0.87,
    3.0: 0.85
}

# Derating factors for grouping (direct buried cables in trefoil arrangement)
# Format: {num_circuits: {spacing: derating_factor}}
derating_grouping_buried_trefoil = {
    2: {0: 0.82, 0.25: 0.87, 0.5: 0.90, 1.0: 0.94},
    3: {0: 0.71, 0.25: 0.77, 0.5: 0.82, 1.0: 0.88},
    4: {0: 0.64, 0.25: 0.72, 0.5: 0.77, 1.0: 0.84},
    5: {0: 0.59, 0.25: 0.68, 0.5: 0.74, 1.0: 0.81},
    6: {0: 0.56, 0.25: 0.65, 0.5: 0.71, 1.0: 0.79}
}

# Derating factors for grouping (direct buried cables in flat formation)
derating_grouping_buried_flat = {
    2: {0: 0.79, 0.25: 0.85, 0.5: 0.89, 1.0: 0.93},
    3: {0: 0.69, 0.25: 0.76, 0.5: 0.81, 1.0: 0.87},
    4: {0: 0.63, 0.25: 0.71, 0.5: 0.76, 1.0: 0.83},
    5: {0: 0.58, 0.25: 0.67, 0.5: 0.73, 1.0: 0.80},
    6: {0: 0.55, 0.25: 0.64, 0.5: 0.70, 1.0: 0.78}
}

# Derating factors for grouping (cables in air - trefoil arrangement)
derating_grouping_air_trefoil = {
    2: {0: 0.84, 0.25: 0.90, 0.5: 0.94},
    3: {0: 0.76, 0.25: 0.85, 0.5: 0.90},
    4: {0: 0.71, 0.25: 0.82, 0.5: 0.88},
    5: {0: 0.67, 0.25: 0.79, 0.5: 0.86},
    6: {0: 0.65, 0.25: 0.77, 0.5: 0.85}
}

# Derating factors for grouping (cables in air - horizontal flat arrangement)
derating_grouping_air_flat = {
    2: {0: 0.83, 0.25: 0.88, 0.5: 0.93},
    3: {0: 0.75, 0.25: 0.83, 0.5: 0.89},
    4: {0: 0.70, 0.25: 0.80, 0.5: 0.87},
    5: {0: 0.66, 0.25: 0.77, 0.5: 0.85},
    6: {0: 0.64, 0.25: 0.75, 0.5: 0.84}
}

# AC Resistance and Reactance for 11kV XLPE Aluminum Single-Core Cables
ac_resistance_11kv = {
    35: 1.05,
    50: 0.76,
    70: 0.56,
    95: 0.41,
    120: 0.33,
    150: 0.27,
    185: 0.22,
    240: 0.17,
    300: 0.14,
    400: 0.11,
    500: 0.09,
    630: 0.07,
    800: 0.06,
    1000: 0.05
}

reactance_11kv = {
    35: 0.146,
    50: 0.141,
    70: 0.136,
    95: 0.132,
    120: 0.129,
    150: 0.127,
    185: 0.125,
    240: 0.122,
    300: 0.120,
    400: 0.118,
    500: 0.116,
    630: 0.114,
    800: 0.112,
    1000: 0.110
}

# Screen bonding effect multipliers for impedance
screen_bonding_effect = {
    'resistance': {
        'single_point': 1.0,
        'both_ends': 1.1,  # average 10% increase (range 5-15%)
        'cross_bonded': 1.02  # average 2% increase (range 1-3%)
    },
    'reactance': {
        'single_point': 1.0,
        'both_ends': 0.95,  # average 5% decrease (range 3-7%)
        'cross_bonded': 0.98  # average 2% decrease (range 1-3%)
    }
}

# Cable arrangement effect multipliers for impedance
arrangement_effect = {
    'resistance': {
        'trefoil_touching': 1.0,
        'flat_touching': 1.015,  # average 1.5% increase (range 1-2%)
        'flat_spaced_1d': 1.025  # average 2.5% increase (range 2-3%)
    },
    'reactance': {
        'trefoil_touching': 1.0,
        'flat_touching': 1.125,  # average 12.5% increase (range 10-15%)
        'flat_spaced_1d': 1.2  # average 20% increase (range 15-25%)
    }
}

# Base ampacity ratings and electrical parameters for higher voltage XLPE Aluminum Single-Core Cables
# Note: These dictionaries exclude the derating factors since they remain the same across voltage levels

# Base ampacity ratings for 33kV XLPE Aluminum Single-Core Cables

# In ground installation (direct buried, 20°C ground temperature, 1.0 K.m/W soil thermal resistivity, 1m depth, trefoil formation)
ampacity_ground_33kv = {
    50: 170,
    70: 205,
    95: 240,
    120: 270,
    150: 300,
    185: 335,
    240: 385,
    300: 430,
    400: 490,
    500: 550,
    630: 615,
    800: 675,
    1000: 745
}

# In air installation (30°C ambient temperature, single-point bonded)
ampacity_air_33kv = {
    50: 200,
    70: 245,
    95: 295,
    120: 330,
    150: 370,
    185: 420,
    240: 485,
    300: 550,
    400: 635,
    500: 715,
    630: 805,
    800: 900,
    1000: 990
}

# AC Resistance and Reactance for 33kV XLPE Aluminum Single-Core Cables
ac_resistance_33kv = {
    50: 0.77,
    70: 0.57,
    95: 0.42,
    120: 0.34,
    150: 0.28,
    185: 0.23,
    240: 0.18,
    300: 0.15,
    400: 0.12,
    500: 0.10,
    630: 0.08,
    800: 0.07,
    1000: 0.06
}

reactance_33kv = {
    50: 0.155,
    70: 0.150,
    95: 0.146,
    120: 0.143,
    150: 0.140,
    185: 0.138,
    240: 0.135,
    300: 0.133,
    400: 0.130,
    500: 0.128,
    630: 0.126,
    800: 0.124,
    1000: 0.122
}

# Base ampacity ratings for 66kV XLPE Aluminum Single-Core Cables

# In ground installation
ampacity_ground_66kv = {
    95: 235,
    120: 265,
    150: 295,
    185: 330,
    240: 380,
    300: 425,
    400: 485,
    500: 545,
    630: 610,
    800: 670,
    1000: 740,
    1200: 795,
    1600: 885
}

# In air installation
ampacity_air_66kv = {
    95: 290,
    120: 325,
    150: 365,
    185: 415,
    240: 480,
    300: 545,
    400: 630,
    500: 710,
    630: 800,
    800: 895,
    1000: 985,
    1200: 1065,
    1600: 1210
}

# AC Resistance and Reactance for 66kV XLPE Aluminum Single-Core Cables
ac_resistance_66kv = {
    95: 0.43,
    120: 0.35,
    150: 0.29,
    185: 0.24,
    240: 0.19,
    300: 0.16,
    400: 0.13,
    500: 0.11,
    630: 0.09,
    800: 0.08,
    1000: 0.07,
    1200: 0.06,
    1600: 0.05
}

reactance_66kv = {
    95: 0.163,
    120: 0.160,
    150: 0.157,
    185: 0.155,
    240: 0.152,
    300: 0.150,
    400: 0.147,
    500: 0.145,
    630: 0.143,
    800: 0.141,
    1000: 0.139,
    1200: 0.137,
    1600: 0.135
}

# Base ampacity ratings for 110kV XLPE Aluminum Single-Core Cables

# In ground installation
ampacity_ground_110kv = {
    150: 290,
    185: 325,
    240: 375,
    300: 420,
    400: 480,
    500: 540,
    630: 605,
    800: 665,
    1000: 735,
    1200: 790,
    1600: 880,
    2000: 950
}

# In air installation
ampacity_air_110kv = {
    150: 360,
    185: 410,
    240: 475,
    300: 540,
    400: 620,
    500: 700,
    630: 790,
    800: 880,
    1000: 975,
    1200: 1055,
    1600: 1195,
    2000: 1320
}

# AC Resistance and Reactance for 110kV XLPE Aluminum Single-Core Cables
ac_resistance_110kv = {
    150: 0.30,
    185: 0.25,
    240: 0.20,
    300: 0.17,
    400: 0.14,
    500: 0.12,
    630: 0.10,
    800: 0.08,
    1000: 0.07,
    1200: 0.06,
    1600: 0.05,
    2000: 0.04
}

reactance_110kv = {
    150: 0.169,
    185: 0.167,
    240: 0.164,
    300: 0.162,
    400: 0.159,
    500: 0.157,
    630: 0.155,
    800: 0.153,
    1000: 0.151,
    1200: 0.149,
    1600: 0.147,
    2000: 0.145
}

# Base ampacity ratings for 132kV XLPE Aluminum Single-Core Cables

# In ground installation
ampacity_ground_132kv = {
    185: 320,
    240: 370,
    300: 415,
    400: 475,
    500: 535,
    630: 600,
    800: 660,
    1000: 730,
    1200: 785,
    1600: 875,
    2000: 945,
    2500: 1015
}

# In air installation
ampacity_air_132kv = {
    185: 405,
    240: 470,
    300: 535,
    400: 615,
    500: 695,
    630: 785,
    800: 875,
    1000: 970,
    1200: 1050,
    1600: 1190,
    2000: 1315,
    2500: 1425
}

# AC Resistance and Reactance for 132kV XLPE Aluminum Single-Core Cables
ac_resistance_132kv = {
    185: 0.25,
    240: 0.20,
    300: 0.17,
    400: 0.14,
    500: 0.12,
    630: 0.10,
    800: 0.08,
    1000: 0.07,
    1200: 0.06,
    1600: 0.05,
    2000: 0.04,
    2500: 0.035
}

reactance_132kv = {
    185: 0.170,
    240: 0.167,
    300: 0.165,
    400: 0.162,
    500: 0.160,
    630: 0.158,
    800: 0.156,
    1000: 0.154,
    1200: 0.152,
    1600: 0.150,
    2000: 0.148,
    2500: 0.146
}

# Combined dictionary of all voltage ratings for easy programmatic access
ampacity_ground = {
    11: ampacity_ground_11kv,
    33: ampacity_ground_33kv,
    66: ampacity_ground_66kv,
    110: ampacity_ground_110kv,
    132: ampacity_ground_132kv
}

ampacity_air = {
    11: ampacity_air_11kv,
    33: ampacity_air_33kv,
    66: ampacity_air_66kv,
    110: ampacity_air_110kv,
    132: ampacity_air_132kv
}

ac_resistance = {
    11: ac_resistance_11kv,
    33: ac_resistance_33kv,
    66: ac_resistance_66kv,
    110: ac_resistance_110kv,
    132: ac_resistance_132kv
}

reactance = {
    11: reactance_11kv,
    33: reactance_33kv,
    66: reactance_66kv,
    110: reactance_110kv,
    132: reactance_132kv
}
