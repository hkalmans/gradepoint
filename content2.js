// Initialize variables
let alreadyListening = false;
let lastCourseCodes = [];

// Main function to add column to table [For main course search]
function addColumnToTable() {
    // Get the table element
    const table = document.querySelector(".table.table-striped.table-borderless");
    // If table is not found, retry after 500ms
    if (!table) {
        setTimeout(addColumnToTable, 500);
        return;
    }

    const courseCodes = getCourseCodes(table);

    // Compare current course codes with last course codes
    if (JSON.stringify(lastCourseCodes) !== JSON.stringify(courseCodes)) {
        lastCourseCodes = courseCodes;
        trulyAddColumn(table);
    } else {
        // Check if AVG. GPA column exists
        const headerRow = table.querySelector("thead tr");
        const headerCells = headerRow.querySelectorAll("th");
        let avgGpaColumnExists = false;

        // Iterate through header cells to find AVG. GPA column
        for (const headerCell of headerCells) {
            if (headerCell.innerText === "AVG. GPA") {
                avgGpaColumnExists = true;
            }
        }

        // If AVG. GPA column does not exist, add the column
        if (!avgGpaColumnExists) {
            trulyAddColumn(table);
        }
    }

    // Repeat the function every 1000ms
    setTimeout(addColumnToTable, 1000);
}


// Function to add AVG. GPA column to the table
async function trulyAddColumn(table) {
    // Add new header column for AVG. GPA
    const headerRow = table.querySelector("thead tr");
    const newHeader = document.createElement("th");
    newHeader.innerText = "AVG. GPA";
    newHeader.setAttribute("scope", "col");
    headerRow.appendChild(newHeader);

    // Add new data column for AVG. GPA to each row
    const rows = table.querySelectorAll("tbody tr");
    const courseInfo = []
    for (const row of rows) {
        const courseCodeElement = row.querySelector("th a");
        const courseCode = courseCodeElement.textContent;
        const numSections = row.querySelector('th small').textContent.split(' ')[0]; // Extract number of sections
        courseInfo.push({
            courseCode: courseCode,
            sectionCount: numSections
        })
    }
    const gpas = await getGPAS(courseInfo);
    for (const row of rows) {
        const courseCodeElement = row.querySelector("th a");
        const courseCode = courseCodeElement.textContent;
        const newCell = document.createElement("td");

        newCell.innerText = gpas[courseCode] ? gpas[courseCode] : "N/A";

        if (gpas[courseCode]) {
            newCell.style.backgroundColor = getGradientColor(gpas[courseCode]);
            newCell.className = "show-gpa"
        }

        row.appendChild(newCell);
    }
}

const letters = [
    "A", "B", "C", "D", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]

async function getGPAS(courseInfo) {
    let finalCourseNames = [];
    for (const course of courseInfo) {
        for (let i = 0; i < course.sectionCount; i++) {
            if (i + 1 >= letters.length) {
                break;
            }
            const courseName = `${course.courseCode} ${letters[i]}`;
            finalCourseNames.push(courseName);
        }
    }
    const gpa = await fetch(`https://bhpscfcsjsqqqtovmwfk.functions.supabase.co/get-gpas-for-courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            courseNumbers: finalCourseNames.filter(onlyUnique)
        })
    });
    const {data: gpaJson} = await gpa.json();

    // Calculate AVG GPAS
    const avgGPAS = calculateAverageGPA(gpaJson)

    return avgGPAS;
}

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

// Function to get course codes from the table
function getCourseCodes(table) {
    const courseCodes = [];
    const rows = table.querySelectorAll("tbody tr");

    // Iterate through rows and extract course codes
    for (const row of rows) {
        const courseCodeElement = row.querySelector("th a");
        const courseCode = courseCodeElement.textContent;
        courseCodes.push(courseCode);
    }

    return courseCodes;
}

function calculateAverageGPA(data) {
    // Create an object to store the sum of GPAs and count for each course
    const courseGPAData = {};

    // Iterate through each data item in the input data
    data.forEach(item => {
        // Extract the course number without the letter at the end
        const courseNumber = item.Course_Number.replace(/\s+[A-Za-z]$/, '');

        // If the course number is not already in courseGPAData, add it with the initial values
        if (!courseGPAData[courseNumber]) {
            courseGPAData[courseNumber] = {
                gpaSum: 0,
                count: 0,
            };
        }

        // Add the current item's GPA to the course's cumulative GPA sum and increment the count
        courseGPAData[courseNumber].gpaSum += item.Average_GPA;
        courseGPAData[courseNumber].count += 1;
    });

    // Calculate the average GPA for each course and store it in a new object
    const averageGPAs = {};
    for (const courseNumber in courseGPAData) {
        averageGPAs[courseNumber] = Math.round((courseGPAData[courseNumber].gpaSum / courseGPAData[courseNumber].count) * 100) / 100;
    }

    // Return the object containing the average GPAs for each course
    return averageGPAs;
}

// Call the main function for course search results overview page
addColumnToTable();

// Call the main function for specific course pages and professor info
addColumnToTableProffesor();

function addColumnToTableProffesor() {
    // Get the table
    const tables = document.querySelectorAll("table");
    let header = null;
    try {
        header = document.evaluate("//*[@id=\"course-search-results-panel\"]/div/div/div/div[3]/div[1]/div[1]/h3", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (e) {
        // do nothing
    }
    // Check if table exists
    if (tables.length == 0 || header !== null) {
        // Repeat the function every 1000ms
        setTimeout(addColumnToTableProffesor, 1000);
        return;
    }

    // Get Course Name
    header = document.evaluate("//*[@id=\"main-content\"]/div[1]/h1", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    const courseName = (header.childNodes[0].nodeValue.replace(/\s+/g, " "));
    // Table exists
    // Add the column to the table
    let avgGpaColumnExists = false;

    tables.forEach(table => {
        // Check if AVG. GPA column exists
        const headerRow = table.querySelector("thead tr");
        const headerCells = headerRow.querySelectorAll("th");

        // Iterate through header cells to find Instructor GPA column
        for (const headerCell of headerCells) {
            console.log(headerCell.innerText)
            if (headerCell.innerText.toLowerCase() === "instructor gpa") {
                avgGpaColumnExists = true;
            } else {
                console.log("Instructor GPA not found")
            }
        }

        // If AVG. GPA column does not exist, add the column
        if (!avgGpaColumnExists) {
            addColumnToTableProffesorHelper(table);
            // Get Instructor name, if possible
            const rows = table.querySelectorAll("tbody tr");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                cells.forEach(cell => {
                    const innerDiv = cell.children[0]
                    if (innerDiv) {
                        const classname = innerDiv.className
                        if (classname === "mb-1") {
                            const newCell = document.createElement("td");
                            fetchGPAForInstructorAndCourse(innerDiv.innerText, courseName).then((gpa) => {
                                newCell.innerText = gpa
                                if (!isNaN(gpa)) {
                                    newCell.style.backgroundColor = getGradientColor(gpa);
                                    newCell.className = "show-gpa"
                                }
                                row.appendChild(newCell);

                            })
                        }
                    }
                })

            })
        }
    })

    // Repeat the function every 1000ms
    setTimeout(addColumnToTableProffesor, 1000);
}

function addColumnToTableProffesorHelper(table) {
    // Add new header column for AVG. GPA
    const headerRow = table.querySelector("thead tr");
    const newHeader = document.createElement("th");
    newHeader.innerText = "Instructor GPA";
    newHeader.setAttribute("scope", "col");
    headerRow.appendChild(newHeader);
}

async function fetchGPAForInstructorAndCourse(instructor, course) {
    const data =  await fetch("https://bhpscfcsjsqqqtovmwfk.functions.supabase.co/gpa-by-course-and-prof", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            courseNumber: course,
            primaryInstructor: instructor
        })
    })
    const gpaJson = await data.json();

    return gpaJson.data.length > 0 ? calculateAverageGPA(gpaJson.data)[course.toUpperCase()] : "N/A";

}

/**
 * Get the color corresponding to the input number on a dynamic gradient scale.
 *
 * @param {number} num - The input number (between 1 and 4).
 * @return {string} The corresponding gradient color.
 */
function getGradientColor(num) {
    // Check if the input is within the valid range
    if (num < 1 || num > 4) {
        throw new Error('Invalid input: number should be between 1 and 4.');
    }

    // Calculate the color components based on the input number
    const red = Math.round(255 * (4 - num) / 3);
    const green = Math.round(255 * (num - 1) / 3);
    const blue = 0;

    // Convert the color components to a hex string
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

    // Return the gradient color
    return rgbToHex(red, green, blue);
}

// console.log('content script running');

const style = document.createElement('style');
style.innerHTML = `
  .rating {
    margin-top: 7px;
  }
`;
document.head.appendChild(style);

function appendRMP() {
    let professorLinks;
    const profInterval = setInterval(() => {
        professorLinks = document.querySelectorAll('div.mb-1');
        if (professorLinks.length > 0) {
            clearInterval(profInterval);
            // console.log('Prof names found:', professorLinks);
            professorLinks.forEach(async (link) => {
                let professorName = link.textContent;
                // if professor name includes a middle name (e.g. "John A. Smith"), remove it so it is only John Smith
                if (professorName.split(' ').length > 2) {
                    const professorNameSplit = professorName.split(' ');
                    professorNameSplit.splice(1, 1);
                    professorName = professorNameSplit.join(' ');
                }
                console.log('Professor name:', professorName)
                try {
                    const port = chrome.runtime.connect({ name: 'professor-rating' });
                    port.postMessage({ professorName });
                    port.onMessage.addListener((teacher) => {
                        // console.log('Received response for professor:', teacher);
                        if (teacher.error) {
                            console.error('Error:', teacher.error);
                            insertNoProfError(link, professorName);
                        } else {
                            const avgRating = teacher.avgRating;
                            const numRatings = teacher.numRatings;
                            const avgDifficulty = teacher.avgDifficulty;
                            const wouldTakeAgainPercent = parseInt(teacher.wouldTakeAgainPercent);
                            const legacyId = teacher.legacyId;

                            if (wouldTakeAgainPercent === -1) {
                                console.error('Error: No ratings found for professor.');
                                insertNoRatingsError(link, legacyId);
                                return;
                            }

                            insertNumRatings(link, numRatings, legacyId);
                            insertWouldTakeAgainPercent(link, wouldTakeAgainPercent);
                            insertAvgDifficulty(link, avgDifficulty);
                            insertRating(link, avgRating);
                        }
                    });
                } catch (error) {
                    console.error('Error:', error);
                    insertNoProfError(link, professorName);
                }
            });
        } else {
            // console.log('Retrying every 1500ms until prof names are found...');
        }
    }, 1500);
}

// call appendRMP() when the page is loaded
appendRMP();

// call the function when the URL hash changes
window.addEventListener('hashchange', appendRMP, false);

// Function to parse schedule data and prepare for ICS generation
function parseScheduleAndGenerateICS() {
    console.log('Download schedule button clicked');

    const tableElement = document.querySelector(".table.table-striped.table-borderless");
    if (!tableElement) {
        console.error('Schedule table not found for ICS generation.');
        return;
    }

    const scheduleEvents = [];
    const rows = tableElement.querySelectorAll("tbody tr");

    rows.forEach(row => {
        let courseName = '';
        const courseLinkElement = row.querySelector("th a"); // Used in addColumnToTable
        if (courseLinkElement) {
            courseName = courseLinkElement.textContent;
        } else if (row.cells && row.cells[1]) { // Fallback: often course name is in the second cell
            courseName = row.cells[1].textContent;
        } else if (row.cells && row.cells[0]) { // Fallback: or the first if no 'th a'
            courseName = row.cells[0].textContent;
        }


        // Adjusted indices based on common university schedule table layouts
        // These are guesses and might need verification with the actual table structure.
        // Example: CRN | Course | Title | Credits | Days | Time | Location | Instructor
        // row.cells[0] = CRN/Checkbox
        // row.cells[1] = Course (e.g. CS 101) - Covered by courseName logic above
        // row.cells[2] = Title (e.g. Intro to CS)
        // row.cells[3] = Credits
        // row.cells[4] = Days (e.g. MWF)
        // row.cells[5] = Time (e.g. 10:00 AM - 10:50 AM) -> Needs splitting
        // row.cells[6] = Location
        // row.cells[7] = Instructor

        const daysCell = row.cells && row.cells[4] ? row.cells[4].textContent : '';
        const timeCell = row.cells && row.cells[5] ? row.cells[5].textContent : '';
        const locationCell = row.cells && row.cells[6] ? row.cells[6].textContent : '';
        const instructorCell = row.cells && row.cells[7] ? row.cells[7].textContent : ''; // Adjusted index

        let startTime = '';
        let endTime = '';

        if (timeCell.includes('-')) {
            [startTime, endTime] = timeCell.split('-').map(s => s.trim());
        }

        if (courseName && daysCell && startTime && endTime) {
            scheduleEvents.push({
                name: courseName.trim(),
                days: daysCell.trim(), // Will need further processing for RRULE
                startTime: startTime.trim(),
                endTime: endTime.trim(),
                location: locationCell ? locationCell.trim() : '',
                instructor: instructorCell ? instructorCell.trim() : ''
            });
        }
    });

    console.log(scheduleEvents);
    const icsData = generateICSContent(scheduleEvents);
    if (icsData) { // Ensure icsData is not null or empty before attempting download
        downloadICSFile(icsData, 'schedule.ics');
    } else {
        console.error('ICS data generation failed. Download cancelled.');
    }
}

// Function to trigger browser download for ICS file
function downloadICSFile(icsData, filename) {
    const link = document.createElement('a');
    link.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsData);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(filename + ' download initiated.');
}

// Helper function to map day abbreviations to iCalendar BYDAY format
function mapDayAbbreviation(dayStr) {
    if (!dayStr) return "";
    const dayMappings = {
        "M": "MO", "TU": "TU", "W": "WE", "TH": "TH", "F": "FR", "SA": "SA", "SU": "SU"
    };
    // Normalize common longer abbreviations and handle case-insensitivity
    const normalizedDayStr = dayStr.toUpperCase()
                                .replace(/TUE/g, "TU")
                                .replace(/THUR/g, "TH")
                                .replace(/SAT/g, "SA")
                                .replace(/SUN/g, "SU");

    let icsDays = [];
    let currentDay = "";
    for (let i = 0; i < normalizedDayStr.length; i++) {
        currentDay += normalizedDayStr[i];
        if (dayMappings[currentDay]) {
            icsDays.push(dayMappings[currentDay]);
            currentDay = "";
        } else if (currentDay === "T" && i + 1 < normalizedDayStr.length && normalizedDayStr[i+1] === "H") {
            // Look ahead for TH
            continue;
        } else if (!Object.keys(dayMappings).some(k => k.startsWith(currentDay))) {
            // If currentDay is not a prefix of any key, reset (error/unknown path)
            currentDay = ""; 
        }
    }
    return icsDays.join(',');
}

// Helper function to parse time string (e.g., "10:30 AM") into 24-hour format object
function parseTime(timeStr) {
    if (!timeStr) return null;
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return null;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) { // Midnight case
        hours = 0;
    }
    return { hours, minutes };
}

// Helper function to get the date of the first occurrence of a class meeting
function getFirstEventDate(eventDays, eventStartTimeStr) {
    const dayMap = { "SU": 0, "MO": 1, "TU": 2, "WE": 3, "TH": 4, "FR": 5, "SA": 6 };
    const icsDays = mapDayAbbreviation(eventDays).split(','); // ["MO", "WE", "FR"]
    if (!icsDays.length) return null;

    const { hours: startHours, minutes: startMinutes } = parseTime(eventStartTimeStr);

    const now = new Date();
    let firstEventDate = null;

    for (let i = 0; i < 7; i++) { // Check the next 7 days
        const potentialDate = new Date(now);
        potentialDate.setDate(now.getDate() + i);
        potentialDate.setHours(startHours, startMinutes, 0, 0);

        const currentDayNumeric = potentialDate.getDay(); // 0 for Sunday, 1 for Monday...

        if (icsDays.some(d => dayMap[d] === currentDayNumeric)) {
            // If this potential date is today, ensure it hasn't passed yet
            if (i === 0 && potentialDate < now) {
                continue; // This day's time has passed, look for the next occurrence
            }
            firstEventDate = potentialDate;
            break;
        }
    }
    
    // If all event days in the current week have passed, find the earliest day in the next week.
    if (!firstEventDate) {
        const earliestIcsDay = icsDays.sort((a, b) => dayMap[a] - dayMap[b])[0];
        const earliestDayNumeric = dayMap[earliestIcsDay];
        
        const futureDate = new Date(now);
        futureDate.setDate(now.getDate() + ( (earliestDayNumeric - now.getDay() + 7) % 7 ) );
        if (futureDate <= now && !(futureDate.getDay() === now.getDay() && futureDate > now) ) { // if it's today but time passed, or earlier day of week
             futureDate.setDate(futureDate.getDate() + 7); // Move to next week
        }
        futureDate.setHours(startHours, startMinutes, 0, 0);
        firstEventDate = futureDate;
    }


    return firstEventDate;
}


// Function to generate ICS content string
function generateICSContent(scheduleEvents) {
    let icsString = "";
    icsString += "BEGIN:VCALENDAR\r\n";
    icsString += "VERSION:2.0\r\n";
    icsString += "PRODID:-//GradePoint MyPlan Extension//EN\r\n";
    icsString += "CALSCALE:GREGORIAN\r\n";

    const formatDateToICS = (dateObj) => {
        return dateObj.toISOString().replace(/[-:.]/g, "").substring(0, 15) + "Z";
    };

    scheduleEvents.forEach(event => {
        const uid = Date.now() + Math.random().toString(16).substring(2) + "@myplan.uw.edu";
        const dtStamp = formatDateToICS(new Date());
        const summary = event.name;
        const location = event.location;
        const description = event.instructor ? "Instructor: " + event.instructor : "";

        const firstEventStartDate = getFirstEventDate(event.days, event.startTime);
        if (!firstEventStartDate) {
            console.warn("Could not determine first event date for:", event);
            return; // Skip this event if we can't find its start date
        }

        const startTimeObj = parseTime(event.startTime);
        const endTimeObj = parseTime(event.endTime);

        if (!startTimeObj || !endTimeObj) {
            console.warn("Could not parse time for event:", event);
            return; // Skip if times are invalid
        }

        const dtStart = new Date(firstEventStartDate);
        dtStart.setHours(startTimeObj.hours, startTimeObj.minutes, 0, 0);

        const dtEnd = new Date(firstEventStartDate); // Start with the same date
        dtEnd.setHours(endTimeObj.hours, endTimeObj.minutes, 0, 0);
        
        // Handle cases where end time is on the next day (e.g. evening classes)
        // This basic logic assumes end time is always on the same day as start time or just after midnight.
        // For simple university schedules, this is usually fine.
        if (dtEnd < dtStart) {
            dtEnd.setDate(dtEnd.getDate() + 1);
        }

        const dtStartString = formatDateToICS(dtStart);
        const dtEndString = formatDateToICS(dtEnd);

        const untilDate = new Date(dtStart);
        untilDate.setDate(untilDate.getDate() + (12 * 7)); // 12 weeks
        const untilDateString = formatDateToICS(untilDate);

        const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${mapDayAbbreviation(event.days)};UNTIL=${untilDateString}`;

        icsString += "BEGIN:VEVENT\r\n";
        icsString += "UID:" + uid + "\r\n";
        icsString += "DTSTAMP:" + dtStamp + "\r\n";
        icsString += "DTSTART:" + dtStartString + "\r\n";
        icsString += "DTEND:" + dtEndString + "\r\n";
        icsString += "SUMMARY:" + summary + "\r\n";
        if (location) icsString += "LOCATION:" + location + "\r\n";
        if (description) icsString += "DESCRIPTION:" + description + "\r\n";
        icsString += rrule + "\r\n";
        icsString += "END:VEVENT\r\n";
    });

    icsString += "END:VCALENDAR\r\n";
    return icsString;
}


// Function to add "Download Schedule (.ics)" button
function addDownloadScheduleButton() {
    // Check if the button already exists
    if (document.getElementById('downloadScheduleICS')) {
        return;
    }

    // Attempt to find the main schedule table
    const tableElement = document.querySelector(".table.table-striped.table-borderless");

    // If table is not found, retry after 1000ms
    if (!tableElement) {
        setTimeout(addDownloadScheduleButton, 1000);
        return;
    }

    // Create the download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Schedule (.ics)';
    downloadButton.id = 'downloadScheduleICS';
    downloadButton.className = 'btn btn-primary download-schedule-btn'; // Optional styling

    // Add event listener for parsing and generating ICS file
    downloadButton.addEventListener('click', parseScheduleAndGenerateICS);

    // Insert the button before the table
    if (tableElement.parentNode) {
        tableElement.parentNode.insertBefore(downloadButton, tableElement);
    } else {
        // As a fallback, append to body if parentNode is somehow null, though unlikely for a table
        console.warn("Could not find parent node of the table to insert download button. Appending to body as a fallback.");
        document.body.insertBefore(downloadButton, document.body.firstChild); // Or some other prominent place
    }
}

// Call the new function to add the download button
addDownloadScheduleButton();

function insertRating(link, avgRating) {
    link.insertAdjacentHTML('afterend', `<div class="rating"><b>Rating:</b> ${avgRating}/5</div>`);
}

function insertAvgDifficulty(link, avgDifficulty) {
    link.insertAdjacentHTML('afterend', `<div class="rating"><b>Difficulty:</b> ${avgDifficulty}/5</div>`);
}

function insertWouldTakeAgainPercent(link, wouldTakeAgainPercent) {
    link.insertAdjacentHTML('afterend', `<div class="rating"><b>${wouldTakeAgainPercent}%</b> of students would take this professor again.</div>`);
}

function insertNumRatings(link, numRatings, legacyId) {
    const profLink = `<a target="_blank" rel="noopener noreferrer" href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>${numRatings} ratings</a>`;
    link.insertAdjacentHTML('afterend', `<div class="rating">${profLink}</div>`);
}

function insertNoRatingsError(link, legacyId) {
    link.insertAdjacentHTML(
        'afterend',
        `<div class="rating"><b>Error:</b> this professor has <a target="_blank" rel="noopener noreferrer" href='https://www.ratemyprofessors.com/search/teachers?query=${legacyId}'>no ratings on RateMyProfessors.</a></div>`
    );
}

function insertNoProfError(link, professorName) {
    link.insertAdjacentHTML(
        'afterend',
        `<div class="rating"><b>Professor not found: </b><a target="_blank" rel="noopener noreferrer" href='https://www.ratemyprofessors.com/search/teachers?query=${encodeURIComponent(
            professorName
        )}'>Click to Search RMP</a></div>`
    );
}
