SHELL := /bin/bash

IMAGE := yurirocha-cv-toolchain:2026
REPO_ROOT := $(abspath ..)
BUILD_DIR := $(CURDIR)/build
PUBLIC_DIR := $(REPO_ROOT)/public/cv
LEGACY_PDF := $(REPO_ROOT)/public/assets/cv_yuri_website.pdf
DOCUMENTS := \
	yuri-rocha-cv-en \
	yuri-rocha-cv-ko \
	yuri-rocha-resume-en \
	yuri-rocha-resume-ko

.PHONY: image build verify publish clean

image:
	docker build --tag $(IMAGE) $(CURDIR)

build: image
	mkdir -p $(BUILD_DIR)
	docker run --rm \
		--user "$$(id -u):$$(id -g)" \
		--env HOME=/tmp \
		--env TEXINPUTS=/workspace/cv/src: \
		--volume "$(REPO_ROOT):/workspace" \
		--workdir /workspace/cv \
		$(IMAGE) \
		bash -c 'set -euo pipefail; for document in $(DOCUMENTS); do latexmk -xelatex -file-line-error -halt-on-error -interaction=nonstopmode -outdir=build "src/$${document}.tex"; done'

verify: build
	docker run --rm \
		--user "$$(id -u):$$(id -g)" \
		--env HOME=/tmp \
		--env TEXINPUTS=/workspace/cv/src: \
		--volume "$(REPO_ROOT):/workspace" \
		--workdir /workspace/cv \
		$(IMAGE) \
		bash scripts/verify.sh

publish: verify
	mkdir -p $(PUBLIC_DIR)
	cp $(BUILD_DIR)/yuri-rocha-cv-en.pdf $(PUBLIC_DIR)/
	cp $(BUILD_DIR)/yuri-rocha-cv-ko.pdf $(PUBLIC_DIR)/
	cp $(BUILD_DIR)/yuri-rocha-resume-en.pdf $(PUBLIC_DIR)/
	cp $(BUILD_DIR)/yuri-rocha-resume-ko.pdf $(PUBLIC_DIR)/
	cp $(BUILD_DIR)/yuri-rocha-cv-en.pdf $(LEGACY_PDF)

clean:
	rm -rf $(BUILD_DIR) $(PUBLIC_DIR)
	rm -f $(LEGACY_PDF)
