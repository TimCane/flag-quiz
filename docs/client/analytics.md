# Analytics

The Analytics page (`/analytics`) provides a comprehensive dashboard of learning progress and performance data.

## Charts and Visualizations

### Progress Chart
Line chart showing daily accuracy over time. Tracks how the user's overall performance improves across sessions.

### FSRS Breakdown Chart
Displays the distribution of flags across FSRS states: New, Learning, Review, and Relearning. Shows how many flags have been mastered versus those still being learned.

### Continent Chart
Accuracy breakdown grouped by continent. Helps identify geographic regions where the user needs more practice.

### Confidence Chart
Distribution of user-reported confidence ratings. Reveals whether the user's self-assessment correlates with actual performance.

### Activity Heatmap
Calendar-style heatmap showing the number of attempts per day. Visualizes consistency and study habits over time.

### Confused Pairs Table
Top 50 most frequently confused flag pairs. Shows which flags the user commonly mixes up, ordered by frequency.

### Hardest Flags Table
Flags with the lowest accuracy (minimum 3 attempts). Identifies the most challenging flags for targeted practice.

### Before/After Comparison
Compares performance metrics from the first 7 days of activity against the last 7 days. Quantifies overall improvement.

### Mnemonic Gallery
Gallery view of all user-created mnemonics. Provides quick access to review and manage memory aids.

## Data Sources

All analytics data is fetched from the `/api/stats/*` endpoints. The `useAnalytics` hook manages data fetching and aggregation for the dashboard.
