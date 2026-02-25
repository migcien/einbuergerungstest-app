# Einbuergerungstest DE Trainer

A mobile training and practice app for the German naturalization test (`Einbuergerungstest`).

## What this project is

This project is an Expo React Native app focused on test preparation. It provides an offline-friendly way to:

- study questions in Learn mode,
- run timed-style practice sessions in Exam mode,
- review mistakes after each exam,
- track your learning progress locally on your device.

## What it is for

The goal is practical preparation for the German naturalization test by practicing the official-style question format repeatedly until you are confident.

Current catalog in this repo:

- 310 questions total
- 300 general questions
- 10 state-specific questions for NRW (`Nordrhein-Westfalen`)

Catalog status: updated to January 2026.

## Bundesland selection

The app starts with Bundesland selection so question catalogs can be split by state.

- Currently available: NRW
- Architecture is ready to add additional Bundeslaender and catalogs later

## App info

An in-app info button is included on the home screen with author attribution:

- Developed by `migcien`
- https://github.com/migcien

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npx expo start
```

## Notes

- This is an independent study app.
- It is not an official app from any German federal authority.
