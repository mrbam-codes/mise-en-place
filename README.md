# Mise en Place

A daily hospitality course: three short lessons, each built around a drawn diagram, plus news, a "try this at work" action and a five-question quiz. 661 lessons over 221 days.

Page: https://mrbam-codes.github.io/mise-en-place/

How it works: a scheduled Claude routine writes `briefs/YYYY-MM-DD.json` following `BRIEF.md` and today's entries in `course.json`, checks it with `check.py`, and pushes it to the `briefs` branch. A GitHub Actions workflow on locked `main` takes only checked edition files from that branch and publishes them with main's own page code. Quiz scores, streaks and review questions stay in the reader's browser; nothing is sent anywhere. Lessons are a study guide: check the official source before acting on anything legal.
