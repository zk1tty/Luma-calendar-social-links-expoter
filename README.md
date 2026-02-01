# Objective 

Extract all social links from individual event page

![Demo](demo.gif)


## Workflow

- Step 0: Create CSV file with headers at startup
- Step 1: Navigate to Lu.ma/tech event calendar page
- Step 2: Scroll down 8 times to load more events via infinite scroll
- Step 3: Query the page with AgentQL to extract all event titles and links
- Step 4: For each event in the list:
  - Open a new browser page for the event
  - Query event page data (presented name, host name, hashtags, social links)
  - Display event info and social links in formatted tables
  - Append event data as a CSV row (streamed immediately for interrupt safety)
  - Close the event page
- Step 5: Close browser when all events are processed 


## Example output

```bash
📁 Created CSV file: luma_events.csv
Step 1: Navigating to the page...
Scrolling to the bottom of the page... (num_times = 1)
Content loaded!
Scrolling to the bottom of the page... (num_times = 2)
Content loaded!
Scrolling to the bottom of the page... (num_times = 3)
Content loaded!
Scrolling to the bottom of the page... (num_times = 4)
Content loaded!
Scrolling to the bottom of the page... (num_times = 5)
Content loaded!
Scrolling to the bottom of the page... (num_times = 6)
Content loaded!
Scrolling to the bottom of the page... (num_times = 7)
Content loaded!
Scrolling to the bottom of the page... (num_times = 8)
Content loaded!
Step 2: Issuing AgentQL data query...
Length of event list: 74

📍 Event 1: Title: The LA Grind: Startup Community Basketball | Page: https://luma.com/8x7t34bs
           Event Info            
┌────────────────┬──────────────┐
│ Field          │ Value        │
├────────────────┼──────────────┤
│ Presented Name │ The LA Grind │
│ Host Name      │ Sonja Kleven │
│ Hashtags       │ 健身, 科技   │
└────────────────┴──────────────┘
                                          Social Links                                           
┌───────────┬─────────────────────────────────────────────┬─────────────────────────────────────┐
│ Type      │ Presented By                                │ Host                                │
├───────────┼─────────────────────────────────────────────┼─────────────────────────────────────┤
│ INSTAGRAM │ https://instagram.com/jointhelagrind        │ https://instagram.com/justingordon8 │
│ LINKEDIN  │ https://linkedin.com/in/justincharlesgordon │ -                                   │
│ X         │ https://x.com/justingordon212               │ https://x.com/justingordon212       │
│ TIKTOK    │ -                                           │ -                                   │
│ WEBSITE   │ https://www.thelagrind.com/                 │ -                                   │
└───────────┴─────────────────────────────────────────────┴─────────────────────────────────────┘
✅ Exported event 1/74 to CSV: The LA Grind: Startup Community Basketball
```
