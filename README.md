# SprintifyTicketSphere

## Overview
A modern ticket management system with drag-and-drop Kanban boards for agile project management.

## Features
- Drag-and-drop ticket management
- Parent-child ticket relationships
- Project configuration
- Reporting dashboard

## Installation
```bash
npm install
```

## Running the Application
```bash
npm run dev
```

## Dependencies
- React
- Vite
- react-beautiful-dnd
- shadcn/ui components

## Known Issues
- Parent tickets should follow children when moved on the board
- When moving a parent to 'Done', all children must be complete

