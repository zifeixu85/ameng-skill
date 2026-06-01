#!/usr/bin/env bash
# Round 2: gap-dimension fillers (问题定义/用户研究/信息架构/验证复盘/设计系统治理 + lifecycle orchestrators)
set -uo pipefail
ROOT="/Users/ameng/Workspace/ameng-skill/design-skills-research"
cd "$ROOT"
TODAY="2026-06-02"

GH=(
"[github]-julianoczkowski-design-flow|julianoczkowski/designer-skills|design-flow/SKILL.md|github|universal"
"[github]-julianoczkowski-design-brief|julianoczkowski/designer-skills|design-brief/SKILL.md|github|universal"
"[github]-julianoczkowski-information-architecture|julianoczkowski/designer-skills|information-architecture/SKILL.md|github|universal"
"[github]-pop-define-problem-statement|product-on-purpose/pm-skills|skills/define-problem-statement/SKILL.md|github|universal"
"[github]-pop-define-jtbd-canvas|product-on-purpose/pm-skills|skills/define-jtbd-canvas/SKILL.md|github|universal"
"[github]-pop-iterate-retrospective|product-on-purpose/pm-skills|skills/iterate-retrospective/SKILL.md|github|universal"
"[github]-pop-measure-experiment-design|product-on-purpose/pm-skills|skills/measure-experiment-design/SKILL.md|github|universal"
"[github]-pop-design-sprint-map-target|product-on-purpose/pm-skills|skills/tool-design-sprint-map-and-target/SKILL.md|github|universal"
"[github]-assimovt-problem-validation|assimovt/productskills|skills/problem-validation/SKILL.md|github|universal"
"[github]-assimovt-jtbd-analysis|assimovt/productskills|skills/jtbd-analysis/SKILL.md|github|universal"
"[github]-assimovt-user-interview|assimovt/productskills|skills/user-interview/SKILL.md|github|universal"
"[github]-assimovt-research-synthesis|assimovt/productskills|skills/research-synthesis/SKILL.md|github|universal"
"[github]-dembrandt-information-architecture|dembrandt/dembrandt-skills|skills/information-architecture/SKILL.md|github|universal"
"[github]-dembrandt-user-flows-guided-paths|dembrandt/dembrandt-skills|skills/user-flows-and-guided-paths/SKILL.md|github|universal"
"[github]-dembrandt-nielsen-usability-heuristics|dembrandt/dembrandt-skills|skills/nielsen-usability-heuristics/SKILL.md|github|universal"
"[github]-lyndonkl-reviews-retros-reflection|lyndonkl/claude|skills/reviews-retros-reflection/SKILL.md|github|universal"
"[github]-lyndonkl-cognitive-design|lyndonkl/claude|skills/cognitive-design/SKILL.md|github|universal"
"[github]-owl-jobs-to-be-done|owl-listener/designer-skills|design-research/skills/jobs-to-be-done/SKILL.md|github|universal"
"[github]-owl-card-sort-analysis|owl-listener/designer-skills|design-research/skills/card-sort-analysis/SKILL.md|github|universal"
"[github]-owl-usability-test-plan|owl-listener/designer-skills|design-research/skills/usability-test-plan/SKILL.md|github|universal"
"[github]-owl-design-system-governance|owl-listener/designer-skills|design-systems/skills/design-system-governance/SKILL.md|github|universal"
)

echo "### GitHub round-2 downloads ###"
for e in "${GH[@]}"; do
  IFS='|' read -r dest repo path stype sfmt <<< "$e"
  mkdir -p "$dest"
  if gh api "repos/$repo/contents/$path" -H "Accept: application/vnd.github.raw" > "$dest/SKILL.md" 2>/dev/null && [ -s "$dest/SKILL.md" ]; then
    lines=$(wc -l < "$dest/SKILL.md" | tr -d ' ')
    printf 'url: "https://github.com/%s/blob/HEAD/%s"\nfetched_at: "%s"\nsource_type: "%s"\nskill_format: "%s"\n' "$repo" "$path" "$TODAY" "$stype" "$sfmt" > "$dest/_source.yaml"
    echo "OK   $dest ($lines lines)"
  else
    echo "FAIL $dest <- $repo/$path"; rm -rf "$dest"
  fi
done

echo
echo "### ClawHub round-2 ###"
dest="[clawhub]-c0ldsmi1e-user-research"; mkdir -p "$dest"
if npx -y clawhub@latest inspect "user-research" --file SKILL.md > "$dest/SKILL.md" 2>/dev/null && [ -s "$dest/SKILL.md" ]; then
  printf 'url: "https://clawhub.ai/skills/user-research"\nfetched_at: "%s"\nsource_type: "community"\nskill_format: "openclaw"\n' "$TODAY" > "$dest/_source.yaml"
  echo "OK   $dest ($(wc -l < "$dest/SKILL.md" | tr -d ' ') lines)"
else
  echo "FAIL $dest"; rm -rf "$dest"
fi

echo
echo "Total skill dirs now: $(ls -d \[* 2>/dev/null | wc -l | tr -d ' ')"