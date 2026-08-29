# Course authoring instructions

## Source and build workflow

- Treat `content/lectures/*.qmd` as the source of truth for lecture content.
- Do not edit `app/generated/*.ts` by hand; regenerate it with `npm run content:render`.
- If Quarto is unavailable, run `npm run setup:quarto`. The pinned binary is installed under `.tools/` and discovered automatically.
- After editing a lecture, run `npm run content:render` and `npm run build`.
- Keep all work local unless the user explicitly requests deployment.

## Course-writing behavior

- Before editing anything under `content/lectures/`, read and follow `content/COURSE_STYLE.md`.
- Treat user-provided prose as notes that express intent, not as publishable wording.
- Write directly for the student. Never mention the prompt, the author's mistake, editing history, or internal reasoning in course material.
- Correct factual slips silently in the lecture. If the correction is meaningful, mention it concisely in chat instead of documenting the mistake in the course.
- Preserve the user's intended topic and level while improving factual accuracy, organization, grammar, and pedagogy.
- Default to a minimal presentation. Do not introduce a visual, card layout, animation, callout, or new design pattern unless the user requests it or it materially improves a difficult explanation.
- Reuse established lecture formatting and components before creating new ones.
