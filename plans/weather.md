# Weather Module Design Document

## Overview

The weather module will provide real-time Canadian weather data using Environment and Climate Change Canada's datamart service. This module will integrate with the existing ucanduit tool architecture and eventually connect with Suno API to generate weather-appropriate lofi music.

## Data Sources

### Primary: Environment and Climate Change Canada Datamart
- **Base URL**: `https://dd.weather.gc.ca/`
- **Current Data**: `https://dd.weather.gc.ca/today/`
- **Data Formats**: GRIB2, NetCDF, GeoJSON, Shapefile, CSV, XML
- **Update Frequency**: Real-time with 30-day retention
- **Access**: Free, anonymous access

### Real-time Updates
- **Sarracenia**: `https://metpx.github.io/sarracenia/` for push notifications
- **AMQP Protocol**: Connect to `dd.weather.gc.ca` with anonymous credentials
- **Message Format**: Subtopic format `PRODUCT.DIRECTORY.ON.THE.DATAMART`
- **Filtering**: Support wildcards for specific data types

## Requirements

### Core Functionality
1. **Location Input**: Postal code/zip code or city search (no geolocation for privacy)
2. **Minimalist Display**: Current weather icons with essential data
3. **Data Points**: 
   - Current temperature
   - Humidity
   - Air quality index
   - UV risk level
4. **Auto-refresh**: Every 30 minutes + force refresh on window collapse/reopen
5. **Ticker Integration**: Include weather summary in main app ticker

### Extended Functionality (Modal Window)
1. **Detailed Forecast**: Day forecast with hourly breakdown
2. **Extended Data**:
   - Chance of precipitation
   - Sunset/sunrise times
   - Wind speed and direction
   - Atmospheric pressure
   - Feels-like temperature
3. **Multi-location**: Search and save multiple cities
4. **Historical**: Basic trend data (temperature changes)

## Technical Architecture

### Module Structure
```
ucanduit/dist/tools/
├── weather.js           # Main weather tool (extends ToolBase)
├── weather.css          # Weather-specific styling
└── weather-service.js   # Weather data fetching service
```

### Weather Tool Class (`weather.js`)
- Extends `ToolBase` following existing pattern
- Manages UI state and user interactions
- Handles location storage and preferences
- Coordinates with weather service for data fetching

### Weather Service (`weather-service.js`)
- Dedicated service for Environment Canada API interactions
- Location geocoding/search functionality
- Data parsing and normalization
- Cache management for API responses
- Real-time update subscription handling

### Data Structures

#### Weather Data Model
```javascript
{
  location: {
    name: "Toronto, ON",
    postalCode: "M5V 3A8",
    coordinates: { lat: 43.6532, lon: -79.3832 }
  },
  current: {
    temperature: 22.5,
    humidity: 65,
    uvIndex: 6,
    airQuality: "Good",
    conditions: "partly-cloudy",
    icon: "partly-cloudy-day",
    timestamp: "2025-08-29T14:30:00Z"
  },
  forecast: {
    today: [
      {
        time: "15:00",
        temperature: 24,
        precipitation: 10,
        conditions: "sunny"
      }
    ],
    extended: [
      {
        date: "2025-08-30",
        high: 26,
        low: 18,
        precipitation: 20,
        conditions: "rain"
      }
    ]
  },
  meta: {
    sunrise: "06:24",
    sunset: "19:45",
    lastUpdated: "2025-08-29T14:30:00Z",
    source: "Environment Canada"
  }
}
```

#### Location Storage
```javascript
{
  currentLocation: "toronto_on",
  savedLocations: {
    "toronto_on": {
      name: "Toronto, ON",
      postalCode: "M5V 3A8",
      coordinates: { lat: 43.6532, lon: -79.3832 },
      lastUsed: "2025-08-29T14:30:00Z"
    }
  },
  preferences: {
    autoRefresh: true,
    refreshInterval: 1800000, // 30 minutes in ms
    showInTicker: true,
    units: "metric"
  }
}
```

## API Integration Strategy

### Phase 1: Basic HTTP Polling
- Direct HTTP requests to Environment Canada endpoints
- Parse XML/JSON responses for current conditions
- Implement basic error handling and retry logic

### Phase 2: Real-time AMQP Integration
- Integrate Sarracenia client for push notifications
- Subscribe to relevant weather data streams
- Implement efficient filtering for selected locations

### Phase 3: Advanced Features
- Multi-location support with concurrent data fetching
- Historical trend analysis
- Integration with Suno API for weather-based music generation

## Location Search Implementation

### Postal Code Support
- Canadian postal codes (A1A 1A1 format)
- US ZIP codes (12345 or 12345-6789 format)
- Basic validation and formatting

### City Search
- Environment Canada city database integration
- Fuzzy search with suggestions
- Province/state filtering
- Popular cities quick-select

## Weather Icons and Display

### Icon Mapping
```javascript
const WEATHER_ICONS = {
  'clear': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'rain': '🌧️',
  'snow': '❄️',
  'thunderstorm': '⛈️',
  'fog': '🌫️',
  'wind': '💨'
};
```

### Minimalist Display Layout
- Compact card with icon + temperature
- Hover reveals additional details
- Color-coded indicators for air quality and UV
- Smooth animations for data updates

## Storage Strategy

### Local Storage (Browser Mode)
- Use existing `ToolBase` storage methods
- Store preferences and cached weather data
- Location history for quick access

### External File Storage (Tauri Mode)
- JSON file: `ucanduit-weather.json`
- Automatic migration from localStorage
- Backup current weather data for offline viewing

## Update Mechanisms

### Auto-refresh Timer
- 30-minute intervals by default
- Configurable refresh rate
- Pause when window is not visible
- Force refresh on window focus

### Manual Refresh
- Pull-to-refresh gesture support
- Refresh button in detailed view
- Loading indicators during updates

### Real-time Updates (Future)
- AMQP subscription for selected locations
- Push notifications for weather alerts
- Efficient delta updates

## Ticker Integration

### Weather Summary Format
- "Toronto: 22°C ⛅ UV:6 Air:Good"
- Rotating display for multiple locations
- Click to expand detailed view
- Color indicators for alerts/warnings

## Error Handling

### Network Issues
- Graceful fallback to cached data
- Clear error messages for connectivity issues
- Automatic retry with exponential backoff

### API Limitations
- Rate limiting compliance
- Alternative endpoint fallbacks
- Data validation and sanitization

### User Input Validation
- Postal code format verification
- City name suggestions for typos
- Clear feedback for invalid locations

## Future Integrations

### Suno API Music Generation
- Weather condition → music prompt mapping
- Temperature ranges → tempo/energy levels
- Time of day consideration
- Seasonal mood adjustments

### Advanced Features
- Weather alerts and notifications
- Severe weather warnings
- Air quality health recommendations
- UV protection reminders

## Development Phases

### Phase 1: Core Implementation (Current)
- [x] Research Environment Canada APIs
- [x] Design module architecture
- [ ] Implement basic weather tool UI
- [ ] Create weather data service
- [ ] Add location search functionality
- [ ] Integrate with ticker system

### Phase 2: Enhanced Features
- [ ] Implement detailed weather modal
- [ ] Add real-time AMQP updates
- [ ] Multi-location support
- [ ] Weather trend visualization

### Phase 3: Music Integration
- [ ] Connect with Suno API
- [ ] Implement weather-to-music mapping
- [ ] Add music generation triggers
- [ ] User preference customization

## Technical Considerations

### Performance
- Efficient data caching to minimize API calls
- Debounced search input for location lookup
- Lazy loading of detailed weather data
- Memory-efficient icon rendering

### Privacy
- No geolocation tracking
- User-initiated location queries only
- Local storage of preferences
- Clear data retention policies

### Accessibility
- Screen reader compatible weather descriptions
- High contrast mode for weather icons
- Keyboard navigation support
- Clear visual hierarchy

### Cross-platform Compatibility
- Browser mode fallbacks
- Tauri-specific optimizations
- Responsive design for different window sizes
- Touch-friendly interface elements