# Curriculum vitae sources

This directory contains two distinct CV formats, each maintained in English
and Korean:

- `yuri-rocha-resume-*.tex`: a one-page professional resume;
- `yuri-rocha-cv-*.tex`: a multi-page comprehensive CV.

The legacy CV archive and interview-preparation documents are reference
material only. They are not copied into this repository. Public documents use
facts already present on the portfolio or independently verifiable public
records.

## Build and verify

Docker is the only local prerequisite:

```bash
npm run cv:build
npm run cv:verify
```

The generated review PDFs stay under `cv/build/` and are ignored by Git. To
copy approved PDFs into Vite's public directory, run `npm run cv:publish`.

## Privacy and publication

Do not add private contact details, interview answers, internal customer
information, or non-public performance claims. Publishing, committing, and
pushing are separate review steps.

The template and build code are available under the repository's MIT license.
The CV prose and generated PDFs are © Yuri Rocha. All rights reserved.
