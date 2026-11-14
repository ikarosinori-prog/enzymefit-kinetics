# Evaluation

## What I wanted the app to do

I wanted an app that could accept an enzyme-kinetics CSV file, fit the Michaelis–Menten model using R, estimate Vmax and Km, and display the observations with the fitted curve.

## Test 1 — Built-in example dataset

The built-in example dataset loaded successfully and displayed eight observations. The maximum-rate estimate was 1.571 µmol/min, the Michaelis constant was 0.8974 mM, and the coefficient of determination was 0.9991. The app also displayed the observations with the fitted Michaelis–Menten curve. This showed that the example-analysis workflow was operating.

## Problem encountered

The external CSV upload initially did not work, even though the built-in example dataset worked. I asked Copilot Agent to inspect and correct the upload workflow rather than replacing the analysis with hardcoded results.

## Test 2 — Valid external CSV and known-value check

I uploaded enzyme_kinetics_example.csv, which contains 24 observations. The data were simulated using true Vmax = 100 µmol/min and true Km = 2 mM, with a small amount of random noise.

The app correctly displayed the uploaded filename and 24 rows. After fitting, it reported:

- Vmax = 102 µmol/min
- Km = 2.073 mM
- R² = 0.9986

These estimates are close to the values used to generate the data and agree with an independent fit of the same CSV. The fitted curve visually followed the observations and approached a plateau.

This test passed. The successful upload after the correction also showed that the app was analysing the external file rather than displaying only the original example.

## Invalid-input test

I tested the app using `invalid-test.csv`, which contained `not_a_number` in the rate column. The app rejected the input and displayed the message: “Row 3 has a missing or invalid concentration or rate.” No fitted curve or numerical parameter estimates were produced. Therefore, the app handles invalid numerical input appropriately instead of silently fitting it as valid data.

## Current limitations

Successful recovery of parameters from one simulated dataset does not establish performance for every experimental dataset. Appropriate initial-rate measurements, a suitable substrate-concentration range, and consistency with Michaelis–Menten behaviour remain important when interpreting real experimental data.