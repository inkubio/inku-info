import { h, app } from 'hyperapp';
import { API_KEY, CALENDAR_ID } from '../config';
import './style.css';

/**
 * Google Calendar API URL for listing events from a calendar.
 * The API returns events in an array of JSON objects representing
 * the calendar events with following structure (irrelevant
 * fields omitted):
 * 
 * {
 *   ...
 *   summary: <The title of the event>,
 *   start: {
 *     date: <Event start date as YYYY-MM-DD> OR
 *     dateTime: <Event start date as RFC3339 formatted string>
 *   },
 *   end: {
 *     <Same as 'start'>
 *   },
 *   location: <Event location>
 *   description: <Event description>
 *   ...
 * }
 */
const API_URL = 
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;

/**
 * Additional url params for tweaking Google Calendar API output.
 * This is a function so that the 'timeMin' is always refreshed
 * when fetching new array of events.
 */
const getParams = () =>
    `&timeMin=${(new Date()).toISOString()}&orderBy=startTime&singleEvents=true`;

/** Initializes the app state with an empty list of events */
const initialState = {
    events: [],
};

/** Collection of functions that modify the app state */
const actions = {
    /** Separate state updater function to allow async fetching */
    setEvents: events => state => ({events}),

    /** Fetches new events from the api and returns 10 most recent events */
    getEvents: () => async (state, actions) => {
        const url = `${API_URL}${getParams()}`;
        const data = await fetch(url);
        const jsonData = await data.json();
        const events = jsonData.items;
        actions.setEvents(events.slice(0, 10));
    }
}

/** Config objects for 'Date.toLocaleString()' */
const timeConf = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Helsinki',
};

const longDateConf = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Helsinki',
};

const shortDateConf = {
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Europe/Helsinki',
}

const longDateTimeConf = {
    ...longDateConf,
    ...timeConf,
};

const shortDateTimeConf = {
    ...shortDateConf,
    ...timeConf,
};

/**
 * Date comparison helper, checks if the passed 'Date' objects have
 * the same day
 */
const sameDateTimeDay = (startDate, endDate) => (
    startDate.toLocaleString('fi-FI', shortDateConf) ===
        endDate.toLocaleString('fi-FI', shortDateConf)
);

/** Returns events datetime with day of the week as a word instead of a number */
const getLongDate = (event) => {
    var dateTimeString;

    // Check if the event has a long dateTime or just the date
    if (event.start.dateTime) {
        const date = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);

        // If the event ends during the same day, only append the ending hours
        // instead of the whole ending dateTime
        dateTimeString =
            `${date.toLocaleString('fi-FI', longDateTimeConf)} - ${endDate.toLocaleString('fi-FI',
                sameDateTimeDay(date, endDate) ? timeConf : longDateTimeConf)}`;
    } else {
        const date = new Date(event.start.date);
        const endDate = new Date((new Date(event.end.date)).getTime() - 24*60*60*1000);
        dateTimeString = date.toLocaleString('fi-FI', longDateConf);
        dateTimeString += date.getTime() === endDate.getTime()
                ? ''
                : ` - ${endDate.toLocaleString('fi-FI', longDateConf)}`;
    }
    return dateTimeString;
};

/** Returns events datetime as numerical string */
const getShortDate = (event) => {
    var dateTimeString;
    if (event.start.dateTime) {
        const date = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        dateTimeString =
            `${date.toLocaleString('fi-FI', shortDateTimeConf)} - ${endDate.toLocaleString('fi-FI',
                sameDateTimeDay(date, endDate) ? timeConf : shortDateTimeConf)}`;
    } else {
        const date = new Date(event.start.date);
        const endDate = new Date((new Date(event.end.date)).getTime() - 24*60*60*1000);
        dateTimeString = date.toLocaleString('fi-FI', shortDateConf);
        dateTimeString += date.getTime() === endDate.getTime()
            ? ''
            : ` - ${endDate.toLocaleString('fi-FI', shortDateConf)}`;
    }
    return dateTimeString;
};

/**
 * Returns events location while stripping away filter strings.
 * These include "too obvious" things like Otaniemi's exact location
 */
const filterLocation = (event) => {
    if (!event.location) return '';
    const filteredStrings = [
        '02150',
        'Finland',
    ];
    const locationString = event.location;
    const parts = locationString.split(',');
    const filteredParts = parts.filter(part =>
        !filteredStrings.some(filter => part.includes(filter)),
    );
    return filteredParts.join(', ');
}

/** Topmost item in the screen */
const BigItem = ({event}) => (
    <div className="BigItem card">
        <h2>{event.summary}</h2>
        {!!event.description &&
            <p className="medium">
                <i>{event.description}</i>
            </p>
        }
        <p className="medium">
            {getLongDate(event)}
        </p>
        {event.location &&
            <p className="medium">
                <i>{filterLocation(event)}</i>
            </p>
        }
    </div>
);

/** Midsized items in left column */
const MediumItem = ({event}) => (
    <div className="MediumItem card">
        <h2>{event.summary}</h2>
        <p className="small">
            {getLongDate(event)}
        </p>
        {event.location &&
            <p className="small">
                <i>{filterLocation(event)}</i>
            </p>
        }
    </div>
);

/** Smallest items in right column */
const SmallItem = ({event}) => (
    <div className="SmallItem card">
        <h2>{event.summary}</h2>
        <p className="tiny">
            {getShortDate(event)}
        </p>
        {event.location &&
            <p className="tiny">
                <i>{filterLocation(event)}</i>
            </p>
        }
    </div>
);

/** Main component for rendering the page */
const view = (state, actions) => (
    <main className="InkuInfo">
        <BigItem event={state.events[0]} />
        <div className="column w66">
            {state.events.slice(1, 4).map(event => <MediumItem event={event} />)}
        </div>
        <div className="column w33">
            {state.events.slice(4, 9).map(event => <SmallItem event={event} />)}
        </div>
    </main>
);

const main = app(initialState, actions, view, document.body);

main.getEvents();
setInterval(main.getEvents, 5000);