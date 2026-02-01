const { wrap, configure } = require('agentql');
const { chromium } = require('playwright');
const fs = require('fs');
const { Table } = require('console-table-printer');

// CSV file setup
const CSV_FILE = 'luma_events.csv';
const CSV_HEADERS = [
  'Event Title',
  'Event Link',
  'Presented Name',
  'Host Name',
  'Hashtags',
  'Presented Instagram',
  'Presented LinkedIn',
  'Presented X',
  'Presented TikTok',
  'Presented Website',
  'Host Instagram',
  'Host LinkedIn',
  'Host X',
  'Host TikTok',
  'Host Website',
];

// Create CSV file with headers at startup
fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n', 'utf8');
console.log(`📁 Created CSV file: ${CSV_FILE}`);

async function pressKeyAndScroll(page) {
  await page.keyboard.press('End');
  // Wait for network requests to complete (infinite scroll content loading)
  await page.waitForLoadState('networkidle');
  // Additional wait to ensure content is rendered
  await page.waitForTimeout(1000);
}

(async () => {
  // Configure the AgentQL API key
  configure({
    apiKey: process.env.AGENTQL_API_KEY, // This is the default and can be omitted.
  });

  // TODO: Toggle headless mode for the main page
  const browser = await chromium.launch({ headless: true });
  const page = await wrap(await browser.newPage());

  const LIST_EVENTS_QUERY = `
  {
      events[]{
        event_title
        event_link
      }
  }
      `;

  const EVENT_PAGE_QUERY = `
  {
      presented_icon_btn
      presented_name
      presented_social_links[]{
          instagram_link
          linkedin_url
          x_url
          tiktok_url
          website_url
      }
      host_icon_btn
      host_name
      host_social_links[]{
          instagram_link
          linkedin_url
          x_url
          tiktok_url
          website_url
      }
      hashtags[]
  }`;

  console.log('Step 1: Navigating to the page...');

  await page.goto('https://luma.com/tech');

  await page.waitForLoadState();

  const numExtraPagesToLoad = 8; //Last event: Apr 1, Wednesday.

  for (let i = 0; i < numExtraPagesToLoad; i++) {
    console.log(`Scrolling to the bottom of the page... (num_times = ${i + 1})`);
    await pressKeyAndScroll(page);
    console.log('Content loaded!');
  }

  console.log('Step 2: Issuing AgentQL data query...');
  const response = await page.queryData(LIST_EVENTS_QUERY);

  const { events: eventList } = response;

  console.log('Length of event list:', eventList.length);

  for (let i = 0; i < eventList.length; i++) {
    const { event_link: eventLink, event_title: eventTitle } = eventList[i];
    const eventCount = i + 1;

    const eventPage = await wrap(await browser.newPage());
    await eventPage.goto(eventLink);
    const eventPageResponse = await eventPage.queryData(EVENT_PAGE_QUERY);

    console.log(`\n📍 Event ${eventCount}: Title: ${eventTitle} | Page: ${eventLink}`);

    // Basic info table
    const infoTable = new Table({
      title: 'Event Info',
      columns: [
        { name: 'field', title: 'Field', alignment: 'left' },
        { name: 'value', title: 'Value', alignment: 'left' },
      ],
    });
    infoTable.addRow({ field: 'Presented Name', value: eventPageResponse.presented_name || 'N/A' });
    infoTable.addRow({ field: 'Host Name', value: eventPageResponse.host_name || 'N/A' });
    infoTable.addRow({ field: 'Hashtags', value: (eventPageResponse.hashtags || []).join(', ') || 'N/A' });
    infoTable.printTable();

    // Flatten social links helper
    const flattenLinks = (links) => {
      if (!links) return {};
      return links.reduce((acc, link) => {
        Object.entries(link).forEach(([key, value]) => {
          if (value) acc[key] = value;
        });
        return acc;
      }, {});
    };

    const presentedLinks = flattenLinks(eventPageResponse.presented_social_links);
    const hostLinks = flattenLinks(eventPageResponse.host_social_links);

    // Social links table
    const socialTable = new Table({
      title: 'Social Links',
      columns: [
        { name: 'type', title: 'Type', alignment: 'left' },
        { name: 'presented', title: 'Presented By', alignment: 'left' },
        { name: 'host', title: 'Host', alignment: 'left' },
      ],
    });

    const linkTypes = ['instagram_link', 'linkedin_url', 'x_url', 'tiktok_url', 'website_url'];
    linkTypes.forEach(type => {
      const label = type.replace('_link', '').replace('_url', '').replace('_', ' ').toUpperCase();
      socialTable.addRow({
        type: label,
        presented: presentedLinks[type] || '-',
        host: hostLinks[type] || '-',
      });
    });
    socialTable.printTable();

    // Escape CSV value (handle commas and quotes)
    const escapeCSV = (val) => {
      if (!val || val === 'N/A') return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV row
    const csvRow = [
      escapeCSV(eventTitle),
      escapeCSV(eventLink),
      escapeCSV(eventPageResponse.presented_name),
      escapeCSV(eventPageResponse.host_name),
      escapeCSV((eventPageResponse.hashtags || []).join('; ')),
      escapeCSV(presentedLinks.instagram_link),
      escapeCSV(presentedLinks.linkedin_url),
      escapeCSV(presentedLinks.x_url),
      escapeCSV(presentedLinks.tiktok_url),
      escapeCSV(presentedLinks.website_url),
      escapeCSV(hostLinks.instagram_link),
      escapeCSV(hostLinks.linkedin_url),
      escapeCSV(hostLinks.x_url),
      escapeCSV(hostLinks.tiktok_url),
      escapeCSV(hostLinks.website_url),
    ].join(',');

    // Append row to CSV file immediately (data persists even if interrupted)
    fs.appendFileSync(CSV_FILE, csvRow + '\n', 'utf8');
    console.log(`✅ Exported event ${eventCount}/${eventList.length} to CSV: ${eventTitle}`);

    await eventPage.close();
  }

  console.log(`\n📁 CSV export complete: ${CSV_FILE} (${eventList.length} events)`);

  await browser.close();
})();
