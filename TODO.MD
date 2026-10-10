# TODO: things we have to or could still implement

## Features
[ X] Display polls with a date in the events list.
[ X] Swiping left or right on the weekly / monthly calendar view will go to the previous / next month.
[ X] In the weekly view of the calendar, you can see your attendance reply (or your poll answer, truncate text if too long) on the right of the event or poll.
[ X] Role 'coach' should be called 'captain', and we need the role 'trainer'.
[ X] The Team screen should have a grid of a vew large buttons for the different sub-screens, each showing a relevant name and emoji. We have the Roster sub-screen, which is the current team screen, the Stats screen, the Adt-timer screen, and the Boete screen.
[ X] When clicking a player on the team roster screen, we should go to a screen where we can see some details of the player (player profile page), including their name and avatar, the year & month they joined, their status and role(s), and attendance rates (seperate for trainings, games, and borrels). Captains should be able to also change names of players, and players their own name.
[ X] Clicking on your name on the top right of the header in the app also brings you to your player profile page.
[ X] Polls and events can have an 'answer by' date, after which only captains can change attendance. If a player with status active does not manage to give their attendance in time, they will receive a monitairy penalty (boete), which can be seen by everyone on the Boete screen. Captains can change (future) boete amounts per type of boete in a boete settings screen, as well as delete issued boetes.
[ X] When a captain clicks on an event and is on the event details screen, they can click on button(s) with red text on the right of every player. Next to present players there are two buttons, which say 'arrived late' and 'no-show'. Next to maybe and absent players, there is a button which says 'invalid reason'. When these buttons are clicked, corresponding boetes are added to the boete screen. (Each of the button type & event type combinations are different boete types.)
[ X] New event type: Eten. Possible to create event called Eten. It also has the extra togglable feature: Big Sunday.
[ X] Make the activities on the schedule screen more compact without showing less info.
[ X] Changing the appearance of the activities which have to be filled in ASAP.
[ X] Adding the possibility to add a small profile picture.
[ ] Improving the login screen
[ ] Editing events & polls after creation (captains only)
[ ] Being able to see profile pictures at poll and event details screen next to player names.
[ ] Adding a button on the right side of List/Calendar toggle on the schedule screen called 'Borrels' that lets you filter on only events of type Social (Only on list view)
[ ] Adding the option to display the color of team outfit that has to be worn at a competition game (either red or green).

## Appearance
[ X] There are some legibility issues with the arrows on the calendar screens, we should make them darker.

## Ideas & research
[ ] Are there any ways we can improve performance of the app?
[ ] After users clicked "Add to homescreen" when visiting the app, can we send them notifications similar to regular apps?
[ ] Can we sync the events to a google calendar?
[ ] Are there any other usefull features we could implement?

## Suggested TODO's by Agent
[ ] Implement PWA features & Push Notifications (manifest.json, Service Worker, VAPID).
[ ] Implement Google Calendar Sync (e.g. /api/calendar/[userId].ics endpoint).