# Prompt record

**Project:** EnzymeFit enzyme-kinetics app  
**Tool:** GitHub Copilot Agent mode in GitHub Codespaces

**Chat-history note:** The original complete Copilot Chat transcript was unavailable when this record was compiled. Entries labelled “reconstructed summary” describe the requests I made based on my preserved app plan, the resulting application, and my subsequent testing. They are not verbatim quotations. The App plan section in `README.md` preserves the intended aim, input, method, output, research connection, and scope.


## Prompt 1 — Initial app build

### Prompt summary — reconstructed, not verbatim

I asked GitHub Copilot Agent in Codespaces to create EnzymeFit, a browser application for analysing one enzyme and one initial-rate dataset. I requested CSV input containing substrate concentrations and initial reaction rates, nonlinear Michaelis–Menten regression using R through webR, parameter estimates with units, and a graph showing the observations and fitted curve. I also requested an example dataset and retained the scope of one enzyme and one dataset without inhibitor comparison.


### What Copilot did

Copilot created the EnzymeFit browser application using Vite. It created the project structure, including `index.html`, `package.json`, and source files for the interface, styling, CSV handling, and R/webR analysis.

The app allowed the user to load an example dataset or upload a CSV, select substrate and rate units, preview the data, fit the Michaelis–Menten model using R through webR, and view the fitted curve and parameter estimates.

### What I changed or corrected

No correction was needed for the built-in example dataset at this stage. I tested that dataset before requesting a correction to external CSV upload.

### Result

The built-in example dataset loaded successfully and displayed eight observations. The fit reported a maximum-rate estimate of 1.571 µmol/min, a Michaelis constant of 0.8974 mM, and a coefficient of determination of 0.9991. The observations and fitted curve were displayed together.

This test showed that the example-data analysis worked, but it did not yet establish that an external CSV could be uploaded correctly.

---

## Prompt 2 — Correct external CSV upload

### Prompt summary — reconstructed, not verbatim

I reported that EnzymeFit’s built-in example dataset worked, but my external CSV file would not upload. I asked Copilot to investigate and correct the external CSV upload and parsing problem. After it modified the app, I reloaded the page and tested the same 24-row CSV myself rather than relying only on Copilot’s reported checks.


### What Copilot did

Copilot investigated why the built-in example worked while an external CSV would not upload. It modified the CSV upload and parsing workflow and checked the implementation using generated valid and invalid inputs.

Copilot stated that it could not test my exact named CSV in the browser. Therefore, I treated its checks as useful supporting evidence but performed the decisive upload test myself.

### What I changed or corrected

I reported the failed external CSV upload and requested a correction rather than repeatedly retrying the same broken workflow. After Copilot made its changes, I reloaded the app and repeated the test using `enzyme_kinetics_example.csv`.

I retained the original scope of one enzyme and one dataset and did not request inhibitor comparison or additional unrelated features.

### Result

After the correction, the app displayed the uploaded filename and all 24 observations. The fit reported a maximum-rate estimate of 102 µmol/min, a Michaelis constant of 2.073 mM, and a coefficient of determination of 0.9986. The fitted curve followed the observations closely.

The simulated dataset had been generated using a true maximum rate of 100 µmol/min and a true Michaelis constant of 2 mM, with small random noise. The fitted estimates were close to these known generating values, providing a successful known-value test of both upload and fitting.

### Additional invalid-input check

I separately uploaded `invalid-test.csv`, which contained `not_a_number` in the rate column. The app rejected it and displayed: “Row 3 has a missing or invalid concentration or rate.” No fitted curve or parameter estimates were produced. This confirmed that the invalid numerical input was not silently analysed as valid data.
