/**
 * Form handling functionality
 */

// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
    // Suggestion form
    const suggestionForm = document.getElementById('suggestionForm');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const name = document.getElementById('suggestionName').value;
            const email = document.getElementById('suggestionEmail').value;
            const suggestion = document.getElementById('suggestionText').value;

            // For now, just show a success message
            // In the future, this would send to your backend API
            alert(`Thank you, ${name}! Your suggestion has been submitted.`);

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('suggestionModal'));
            modal.hide();
        });
    }

    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect form data
            const name = document.getElementById('newsletterName').value;
            const email = document.getElementById('newsletterEmail').value;

            // For now, just show a success message
            // In the future, this would send to your backend API
            alert(`Thank you, ${name}! You have been successfully subscribed to our newsletter.`);

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newsletterModal'));
            modal.hide();
        });
    }
});