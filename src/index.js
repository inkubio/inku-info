import { h, app } from 'hyperapp';
import { API_KEY, CALENDAR_ID } from '../config';
import './style.css';

const API_URL = 
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;

const getParams = () =>
    `&timeMin=${(new Date()).toISOString()}&orderBy=startTime&singleEvents=true`;

const initialState = {
    events: [],
};

const actions = {
    getState: () => state => state,

    setEvents: events => state => ({events}),

    getEvents: () => async (state, actions) => {
        const url = `${API_URL}${getParams()}`;
        const data = await fetch(url);
        const jsonData = await data.json();
        const events = jsonData.items;
        actions.setEvents(events.slice(0, 10));
    }
}

const timeConf = {
    hour: '2-digit',
    minute: '2-digit',
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

const sameDateTimeDay = (startDate, endDate) => (
    startDate.toLocaleString('fi-FI', shortDateConf) === endDate.toLocaleString('fi-FI', shortDateConf)
);

/** Returns events datetime with weekday as a word */
const getLongDate = (event) => {
    var dateTimeString;
    if (event.start.dateTime) {
        const date = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        dateTimeString =
            `${date.toLocaleString('fi-FI', longDateTimeConf)} - ${endDate.toLocaleString('fi-FI',
                sameDateTimeDay(date, endDate) ? timeConf : longDateTimeConf)}`;
    } else {
        const date = new Date(event.start.date);
        const endDate = new Date((new Date(event.end.date)).getTime() - 24*60*60*1000);
        dateTimeString =
            `${date.toLocaleString('fi-FI', longDateConf)}` +
            date.getTime() === endDate.getTime() ? '' : ` - ${endDate.toLocaleString('fi-FI', longDateConf)}`;
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
        dateTimeString += date.getTime() === endDate.getTime() ? '' : ` - ${endDate.toLocaleString('fi-FI', shortDateConf)}`;
    }
    return dateTimeString;
};

/** Returns events location while stripping away filter strings */
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
            {event.location && <span>|</span>}
            {filterLocation(event)}
        </p>
    </div>
);

const MediumItem = ({event}) => (
    <div className="MediumItem card">
        <h2>{event.summary}</h2>
        <p className="small">
            {getLongDate(event)}
            {event.location && <span>|</span>}
            {filterLocation(event)}
        </p>
    </div>
);

const SmallItem = ({event}) => (
    <div className="SmallItem card">
        <h2>{event.summary}</h2>
        <p className="tiny">
            {getShortDate(event)}
            {event.location && <span>|</span>}
            {filterLocation(event)}
        </p>
    </div>
);

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