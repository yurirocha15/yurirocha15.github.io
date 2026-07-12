#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="${BUILD_DIR:-build}"
documents=(
  yuri-rocha-cv-en
  yuri-rocha-cv-ko
  yuri-rocha-resume-en
  yuri-rocha-resume-ko
)

fail() {
  printf 'CV verification failed: %s\n' "$1" >&2
  exit 1
}

for document in "${documents[@]}"; do
  pdf="${BUILD_DIR}/${document}.pdf"
  log="${BUILD_DIR}/${document}.log"
  [[ -s "$pdf" ]] || fail "missing PDF: $pdf"
  [[ -s "$log" ]] || fail "missing build log: $log"

  qpdf --check "$pdf" >/dev/null 2>&1 || fail "qpdf rejected $pdf"

  page_size="$(pdfinfo "$pdf" | awk -F: '/^Page size:/ {sub(/^[[:space:]]+/, "", $2); print $2}')"
  [[ "$page_size" == *"A4"* ]] || fail "$pdf is not A4 ($page_size)"

  if pdffonts "$pdf" | tail -n +3 | grep -q 'Type 3'; then
    fail "$pdf contains a Type 3 font"
  fi
  if pdffonts "$pdf" | tail -n +3 | grep -Evq " yes[[:space:]]+yes[[:space:]]+yes[[:space:]]+"; then
    fail "$pdf contains a non-embedded font"
  fi

  if grep -Eq 'Missing character|Overfull \\[hv]box' "$log"; then
    fail "$log contains missing glyphs or overfull boxes"
  fi
done

for document in yuri-rocha-resume-en yuri-rocha-resume-ko; do
  pages="$(pdfinfo "${BUILD_DIR}/${document}.pdf" | awk '/^Pages:/ {print $2}')"
  [[ "$pages" == "1" ]] || fail "$document must be exactly one page (got $pages)"
done

for document in yuri-rocha-cv-en yuri-rocha-cv-ko; do
  pages="$(pdfinfo "${BUILD_DIR}/${document}.pdf" | awk '/^Pages:/ {print $2}')"
  (( pages >= 2 && pages <= 3 )) || fail "$document must use two or three pages (got $pages)"
done

text_dir="$(mktemp -d)"
trap 'rm -rf "$text_dir"' EXIT

for document in "${documents[@]}"; do
  pdftotext -layout "${BUILD_DIR}/${document}.pdf" "${text_dir}/${document}.txt"
done

for token in 'Yuri Rocha' 'Doosan Robotics' 'MakinaRocks'; do
  grep -Fq "$token" "${text_dir}/yuri-rocha-cv-en.txt" || fail "English CV is missing: $token"
  grep -Fq "$token" "${text_dir}/yuri-rocha-resume-en.txt" || fail "English resume is missing: $token"
done

for token in '유리 허샤' '두산로보틱스' '마키나락스'; do
  grep -Fq "$token" "${text_dir}/yuri-rocha-cv-ko.txt" || fail "Korean CV is missing: $token"
  grep -Fq "$token" "${text_dir}/yuri-rocha-resume-ko.txt" || fail "Korean resume is missing: $token"
done

if grep -RiqE 'NPU (expert|specialist)|NPU (kernel|driver|compiler)|low-level NPU' src "$text_dir"; then
  fail 'NPU experience is overstated'
fi

if grep -RiqE '\\(phone|photo)|street address|Skype' src "$text_dir"; then
  fail 'private-contact or photo fields are present'
fi

research_urls=(
  "https://www.mdpi.com/2076-3417/10/9/3219/pdf"
  "https://www.yurirocha.com/assets/Yuri_Master_Thesis.pdf"
  "https://www.yurirocha.com/assets/Mental_Simulation_IROS_2019.pdf"
  "https://www.yurirocha.com/assets/Automatic_Generation_ICCAS2019.pdf"
  "https://www.yurirocha.com/assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf"
)
patent_ids=(
  KR102590491B1
  KR102626109B1
  KR102629021B1
  KR102660168B1
  KR102638245B1
  KR102614099B1
  US12093832B2
  US12049013B1
)

for document in yuri-rocha-cv-en yuri-rocha-cv-ko; do
  url_annotations="$(pdfinfo -url "${BUILD_DIR}/${document}.pdf")"
  for url in "${research_urls[@]}"; do
    grep -Fq "$url" <<<"$url_annotations" || fail "$document is missing research link: $url"
  done
  for patent_id in "${patent_ids[@]}"; do
    url="https://patents.google.com/patent/${patent_id}"
    grep -Fq "$url" <<<"$url_annotations" || fail "$document is missing patent link: $url"
  done
done


for document in yuri-rocha-cv-en yuri-rocha-cv-ko yuri-rocha-resume-en yuri-rocha-resume-ko; do
  url_annotations="$(pdfinfo -url "$BUILD_DIR/$document.pdf")"
  for url in \
    "https://github.com/yurirocha15/mcp-cpp-sdk" \
    "https://www.credly.com/badges/bb876a9e-74e1-475d-b753-c43f2675c9ee" \
    "https://www.credly.com/badges/f1d71150-7469-4e33-9745-758d7256fa35" \
    "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130" \
    "https://github.com/doosan-robotics/explainable-palletizer"; do
    grep -Fq "$url" <<<"$url_annotations" || fail "$document is missing required link: $url"
  done
done

for document in yuri-rocha-resume-en yuri-rocha-resume-ko; do
  url_annotations="$(pdfinfo -url "$BUILD_DIR/$document.pdf")"
  for url in \
    "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130" \
    "https://github.com/doosan-robotics/explainable-palletizer" \
    "https://www.mdpi.com/2076-3417/10/9/3219/pdf" \
    "https://www.yurirocha.com/assets/Mental_Simulation_IROS_2019.pdf" \
    "https://www.yurirocha.com/assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf" \
    "https://patents.google.com/patent/KR102590491B1" \
    "https://patents.google.com/patent/KR102626109B1" \
    "https://patents.google.com/patent/KR102629021B1" \
    "https://patents.google.com/patent/KR102660168B1" \
    "https://patents.google.com/patent/KR102638245B1" \
    "https://patents.google.com/patent/KR102614099B1" \
    "https://patents.google.com/patent/US12093832B2" \
    "https://patents.google.com/patent/US12049013B1"; do
    grep -Fq "$url" <<<"$url_annotations" || fail "$document is missing résumé link: $url"
  done
done

if grep -RIl $'\uFFFD' "$text_dir" >/dev/null; then
  fail 'PDF text contains Unicode replacement characters'
fi

printf 'Verified four A4 CV PDFs with correct page limits and extractable text.\n'
