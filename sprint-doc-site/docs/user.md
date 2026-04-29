# Authored by Thomas Gray

# User Guide
Welcome to the official documentation for the OCC Database System. This guide is designed to help administrators and team members navigate the web interface, and mobile application with ease.

## Navbar
The top navigation bar connects you to every interface page. The sections below explain specific features and workflows. Use the logout button to exit manually, or the system will automatically log you out after 15 minutes.

## Churches
The Churches section is where you can view all of the existing churches in the database, and the information for those churches.

Searchable Directory: The main view features a list of all registered churches. You can search by name, city, zipcode, county, or shoebox count to find a specific location instantly. You can also filter the list to see the churches in alphabetical order or by year. Admins have the ability to delete churches from the system by selecting the red trash can icon in the top right of the church box.

Editing Church Information: If you select the Update (current year) shoebox counts, you can update the shoebox totals for any of the churches. Additionally, if you click Church Information for any of the churches, you can view the current information or edit it by selecting the Edit Church button at the bottom. You can also add a note for a church if needed.

Adding a Church: When adding a new church, the system requires the name, city, and state. Other fields like phone number, county, and specific physical address details are optional but recommended for better data mapping.

Auto-fill Integration: Any church added here becomes available in the rest of the web interface, allowing for seamless data association when you are working in other sections.

Church Dropdown: This searchable dropdown is available on any page where a church selection is required. The list is sorted alphabetically and allows you to find specific churches by searching for a name or city.

## Team Members
This section allows users and admins to see active team members and search for them by name, church name, or county. You can also copy all team emails and download their addresses in an excel file.

Viewing Profiles: Users can view the profile of members to see information pertaining to the member, as well as churches related to the team member.

Adding a Team Member (Admin Only): Admins can add a team member using the Add Member button. Only the first and last name are required but adding the church affiliation, email, phone number, and shirt size is recommended for better data mapping.

Editing and Deleting Members (Admin Only): Admins can update member information or add notes by selecting the Edit Member button. To remove a member from the database, select the trash can icon.

## Individuals
The Individuals section is a major focus of the web interface. This page features a list of contacts from different churches working with OCC and resources they've requested from OCC.

Search and Filter: You can find specific people or check their status using the search and filter tools. The system allows you to filter by name, church name, active or inactive status, and requested resources. You can also sort names alphabetically or copy all emails to your clipboard.

Adding Individuals (Admin Only): Admins can add new records using the Add Individual button. Only the first and last names are required fields for creating a new entry.

Managing Data (Admin Only): The table displays individuals and their related data. Admins can use this area to manage information efficiently.

- Edit Information: Select the pencil icon by the name of an individual to update their records.

- Toggle Status: Use the toggle in the table to switch an individual between active and inactive.

- Delete Individuals: To remove a person from the system, click the red trash can icon on the far right of the table.


## Forms
The Forms section contains the active, inactive, and archived forms used in the mobile interface. You can view all submitted forms and edit their information if needed before the data is pushed to the database.

Form Management: You can create custom forms with fields you select for OCC events or use prebuilt templates. To manage these, use the gear icon to edit a template or the trash can icon to delete a form.

Creating a New Form: To create a new form, select the New Template button. You will need to enter the event name, the destination table in Supabase, and the start and end dates for the form.

Form Status Logic: The status of a form is determined by the dates you set.

- Active: The current date is within the range of the start and end dates

- Inactive: The current date is before the start date

- Archived: The current date is past the end date

## About and Profile
These sections give extra information to the user.

About: Provides extra information on the functionality of the web interface. It goes over the different tabs in the navigation bar to help you understand the purpose of each page.

Profile: Allows you to manage your personal account settings. You can use this area to view or update your user information and team information.

## Mobile Application
The Mobile section provides a one-way link to the mobile interface. This system is designed specifically for iPads to replace the paper forms typically used at events. These digital forms collect information that is reviewed through the web interface before the data is pushed to Supabase.

Admin Login: When you select the mobile tab in the navbar, you are sent to the mobile interface where the Admin Login will appear. This ensures that an admin must log in at an event before handing the iPad to users for data collection.

Progressive Web App (PWA): Instead of a traditional iOS app, we used a Progressive Web App (PWA). This allows you to download the mobile interface directly to the iPad so it can be used like an app without a browser. To install it, go to the top of the mobile browser and select the install button located to the right of the URL. 

Form View: After logging in, you will see all active forms as well as four default legacy templates. You can navigate through these forms during the event. To leave this view, scroll to the bottom of the page and select Reset terminal and exit.

Reliability and Optimization: The mobile interface is specifically optimized for iPad use in the field. The app is built for safety, ensuring that user data does not remain on the device once you exit a form.