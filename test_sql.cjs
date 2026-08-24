const fs = require('fs');

const sqlContent = fs.readFileSync('data15082026.sql', 'utf8');
const insertRegex = /INSERT INTO public\.rt_participants .*? VALUES\s*([\s\S]+?);/i;
const match = sqlContent.match(insertRegex);

if (match) {
    console.log("Matched the INSERT statement!");
    let valuesString = match[1];
    console.log("Length of values string:", valuesString.length);
} else {
    console.log("Failed to match the INSERT statement. Trying another regex.");
    const altMatch = sqlContent.match(/INSERT INTO .*? VALUES\s*([\s\S]+?);/i);
    if (altMatch) {
        console.log("Found a generic insert!");
        console.log(sqlContent.substring(0, 200));
    } else {
        console.log("No INSERT statement found at all. First 200 chars:");
        console.log(sqlContent.substring(0, 200));
    }
}
