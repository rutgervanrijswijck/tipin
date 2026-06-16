# TODO: things we have to or could still implement

## Features
[ ] Display polls with a date in the events list.
[ ] Swiping left or right on the weekly / monthly calendar view will go to the previous / next month.
[ ] In the weekly view of the calendar, you can see your attendance reply (or your poll answer, truncate text if too long) on the right of the event or poll.
[ ] Role 'coach' should be called 'captain', and we need the role 'trainer'.
[ ] The Team screen should have a grid of a vew large buttons for the different sub-screens, each showing a relevant name and emoji. We have the Roster sub-screen, which is the current team screen, the Stats screen, the Adt-timer screen, and the Boete screen.
[ ] When clicking a player on the team roster screen, we should go to a screen where we can see some details of the player (player profile page), including their name and avatar, the year & month they joined, their status and role(s), and attendance rates (seperate for trainings, games, and borrels). Captains should be able to also change names of players, and players their own name.
[ ] Clicking on your name on the top right of the header in the app also brings you to your player profile page.
[ ] Polls and events can have an 'answer by' date, after which only captains can change attendance. If a player with status active does not manage to give their attendance in time, they will receive a monitairy penalty (boete), which can be seen by everyone on the Boete screen. Captains can change (future) boete amounts per type of boete in a boete settings screen, as well as delete issued boetes.
[ ] When a captain clicks on an event and is on the event details screen, they can click on button(s) with red text on the right of every player. Next to present players there are two buttons, which say 'arrived late' and 'no-show'. Next to maybe and absent players, there is a button which says 'invalid reason'. When these buttons are clicked, corresponding boetes are added to the boete screen. (Each of the button type & event type combinations are different boete types.)

## Appearance
[ ] There are some legibility issues with the arrows on the calendar screens, we should make them darker.

## Ideas & research
[ ] Are there any ways we can improve performance of the app?
[ ] After users clicked "Add to homescreen" when visiting the app, can we send them notifications similar to regular apps?
[ ] Can we sync the events to a google calendar?
[ ] Are there any other usefull features we could implement?

## Suggested TODO's by Agent
[ ] Implement performance improvements (pagination, next/image, async Server Components).
[ ] Implement PWA features & Push Notifications (manifest.json, Service Worker, VAPID).
[ ] Implement Google Calendar Sync (e.g. /api/calendar/[userId].ics endpoint).
[ ] Implement Match Reports module for captains.
[ ] Implement Player of the Match (MOTM) automated poll post-game.