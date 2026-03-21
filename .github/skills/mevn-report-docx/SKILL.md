---
name: mevn-report-docx
description: "Write and finalize Vietnamese technical reports for this MEVN project, then prepare Markdown content for DOCX export using the project's report templates."
---

# MEVN Report DOCX

## Use when
- User asks for feature report, chapter draft, or final technical summary.
- Need content that matches niên luận/report structure.

## Inputs
- Report type: feature-final or chapter.
- Target template path in `docs/report-templates/`.
- Scope period (feature/iteration/release).

## Workflow
1. Gather verified implementation facts from codebase.
2. Fill template sections with evidence-based content.
3. Distinguish clearly:
   - implemented
   - not yet implemented
   - future direction
4. Produce clean Markdown ready for DOCX conversion.

## Output format
- Section-complete Markdown
- File evidence summary
- Export note (`pandoc`/docx pipeline if available)
