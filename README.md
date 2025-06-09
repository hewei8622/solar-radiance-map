# Global Solar Radiance Potential Mapping

**Live Demo:** [https://hewei8622.github.io/solar-radiance-map/](https://hewei8622.github.io/solar-radiance-map/)

This is a web-based application for visualizing global solar radiance potential. It provides an interactive map, a filterable data table, and detailed information about solar metrics for various locations around the world.

## Features

- **Interactive Map:** An interactive map powered by Leaflet, with markers color-coded by solar potential.
- **Data Filtering:** Filter data by solar potential class, region, data quality, and PVOUT range.
- **Data Table:** A sortable and searchable table view of the solar data.
- **Export to CSV:** Export the filtered data to a CSV file.
- **Detailed Popups:** Click on any location on the map to see detailed solar radiance metrics.
- **Responsive Design:** A modern and responsive user interface that works on both desktop and mobile devices.
- **Light/Dark Mode:** The application supports both light and dark color schemes.

## Project Structure

- `index.html`: The main HTML file containing the structure of the application.
- `app.js`: The core JavaScript file that handles the application's logic, including map initialization, data processing, and user interactions.
- `style.css`: The stylesheet for the application.
- `solar_radiance_sample.json`: A JSON file containing sample solar radiance data.
- `solar_radiance_sample.csv`: A CSV file containing sample solar radiance data.

## How to Run

1.  Clone this repository to your local machine.
2.  Open the `index.html` file in your web browser.

That's it! The application will load the sample data and display the interactive map.

## Future Improvements

- **External Data Source:** Load data from a remote API instead of a local file to get real-time data.
- **More Data:** Add more data points to cover more locations around the world.
- **"About" Page:** Add content to the "About" page to provide more information about the project and the data sources.
- **Code Modularity:** For larger-scale applications, the JavaScript code could be organized into modules. 