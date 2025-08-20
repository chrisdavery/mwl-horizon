/**
 * Initialize state filtering functionality for trunk shows
 */
function initializeStateFilter() {
    // Get all filter buttons and trunk show items
    const filterButtons = document.querySelectorAll('.button--state-filter');
    const trunkShowItems = document.querySelectorAll('.trunk-show-item');
    
    // Check if elements exist
    if (filterButtons.length === 0 || trunkShowItems.length === 0) {
        console.warn('State filter elements not found');
        return;
    }
    
    /**
     * Filter trunk shows by state tag
     * @param {string} stateTag - The state tag to filter by, or 'all' to show all
     */
    function filterTrunkShows(stateTag) {
        // Remove active class from all buttons
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Handle 'all' filter case
        if (stateTag === 'all') {
            const allButton = document.querySelector('[data-state-tag="all"]');
            if (allButton) {
                allButton.classList.add('active');
            }
            
            // Show all trunk show items
            trunkShowItems.forEach(item => {
                item.classList.add('active');
            });
            
            return;
        }
        
        // Handle specific state filter
        const activeButton = document.querySelector(`[data-state-tag="${stateTag}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Show only items with matching data-state
        trunkShowItems.forEach(item => {
            const itemState = item.getAttribute('data-state');
            if (itemState === stateTag) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Set up event listeners for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            const stateTag = this.getAttribute('data-state-tag');
            if (stateTag) {
                filterTrunkShows(stateTag);
            }
        });
    });
    
    // Check if any button has active class on page load
    const activeButtons = document.querySelectorAll('.button--state-filter.active');
    if (activeButtons.length > 0) {
        // Get the state tag from the active button
        const stateTag = activeButtons[0].getAttribute('data-state-tag');
        if (stateTag) {
            // Filter shows based on the active button's state tag
            filterTrunkShows(stateTag);
        }
    } else {
        // If no button is active, show all trunk show items
        trunkShowItems.forEach(item => {
            item.classList.add('active');
        });
    }
}

// Initialize the state filter
initializeStateFilter();