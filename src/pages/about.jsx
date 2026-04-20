import { Link } from "react-router-dom";

export default function About() {
    const sections = [
        {
            key: "home",
            title: "Home",
            description: (
                <>
                    Navigate to the Home page for a list of churches in the West Alabama area
                    participating in Operation Christmas Child.
                    <br /><br />
                    Clicking on one of the <strong>'Church Information'</strong> buttons will display
                    the location information of the church, its shoebox count, and a list of the
                    individuals at the church involved in OCC. This page will also feature a section for notes, where
                    you can write any relevant information about the church and view any notes written
                    by other team members.
                    <br /><br />
                    The filters at the top of the page allow you to narrow your search results by typing
                    in your desired church name, area code, or shoebox count.
                    <br /><br />
                    If you click on one of the four county buttons, you will see results for churches
                    only in the selected county.
                </>
            ),
        },
        {
            key: "profile",
            title: "Profile",
            description: (
                <>
                    The Profile page displays your name, contact information, and the role associated
                    with your account. Below your contact information there is a list of all notes you have
                    created, and a list of any churches that you are the primary contact for.
                    <br /><br />
                    The <strong>'My Team'</strong> button at the top of the profile card will show you a list
                     of any team members that you oversee.
                    <br /><br />
                    The <strong>'Edit Information'</strong> button will allow you to update any of the information
                    associated with your account.
                    <br /><br />
                    If you wish to sign out of your account, there is a <strong>'logout'</strong> button
                    below the contact information section.
                </>
            ),
        },
        {
            key: "team",
            title: "Team Members",
            description: (
                <>
                    The Team Members page contains a list of all individuals working with Operation
                    Christmas Child West Alabama and their contact information.
                    <br /><br />
                    Click on <strong>'More Information'</strong> to view a member's church affiliation
                    and any alternate contact information.
                </>
            ),
        },
        {
            key: "individuals",
            title: "Individuals",
            description: (
                <>
                    The individuals page features a list of contacts from different churches working with OCC
                    and resources they've requested from OCC.
                    <br /><br />
                    Use the filter buttons to see only individuals who have requested the selected resource.
                    <br /><br />
                    The <strong>'Copy All Emails'</strong> button will copy all email addresses for individuals
                    with the selected filters.
                </>
            ),
        },
    ];

    return (
        <div className="max-w-5xl mx-auto mt-12 px-6">
            <h1 className="text-4xl font-bold mb-10">About</h1>

            <div className="grid md:grid-cols-2 gap-6 auto-rows-min">

                <div className="bg-white p-8 rounded-2xl shadow-sm row-span-2">
                    <h2 className="text-xl font-semibold mb-3">{sections[0].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[0].description}</p>
                </div>


                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">{sections[1].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[1].description}</p>
                </div>


                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">{sections[2].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[2].description}</p>
                </div>

                
                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">{sections[3].title}</h2>
                    <p className="text-gray-700 leading-relaxed">{sections[3].description}</p>
                </div>
            </div>

            <div className="mt-12 mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Mobile App Installation Guide</h2>
                
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">How to install the Progressive Web App (PWA)</h3>
                    <p className="text-gray-700 mb-4">
                        This site's mobile app allows OCC event attendees to electronically submit forms, providing OCC staff with information about their church's OCC ministry. This includes contact information, requests for resources, shoebox counts, and more.
                    </p>
                    <p className="text-gray-700 mb-4 font-semibold">To install the app on an iPad, follow these instructions:</p>
                    <ol className="list-decimal pl-6 space-y-3 mb-6 text-gray-700 font-medium">
                        <li>Visit <a href="https://occ-database.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://occ-database.vercel.app</a> using Safari on your iPad.</li>
                        <li>Log in to the site using your admin credentials</li>
                        <li>Look at the bottom of the mobile browser and select the <strong>Share</strong> button located below the URL.</li>
                        <li>Press the "Add to Home Screen" button.</li>
                    </ol>
                    <p className="text-gray-700 mb-4 font-semibold">After this, you will see the "OCC Portal" app on your homepage. You can access the mobile interface by tapping the OCC icon.</p>
                </div>
            </div>
        </div>
    );
}