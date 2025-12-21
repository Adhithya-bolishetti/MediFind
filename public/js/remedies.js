symptoms
async function displayRemedies(symptoms) {
    console.log('Displaying remedies for:', symptoms);
    
    try {
        const remediesContainer = document.getElementById('remedies-container');
        if (!remediesContainer) return;
        
        // Show remedies section
        const remediesSection = document.getElementById('remedies-section');
        if (remediesSection) {
            remediesSection.style.display = 'block';
        }
        
        // Clear and show loading
        remediesContainer.innerHTML = `
            <div class="remedy-caution">
                <div class="caution-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>⚠️ IMPORTANT SAFETY NOTICE</h4>
                        <p>The information provided is for educational purposes only. Always consult with a healthcare professional before trying any remedies or medications. Use at your own risk and care.</p>
                    </div>
                </div>
            </div>
            <div class="remedy-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading remedies for "${symptoms}"...</p>
            </div>
        `;
        
        // Get remedies from API
        const result = await apiService.getRemedies(symptoms);
        
        if (result.error) {
            remediesContainer.innerHTML = `
                <div class="remedy-caution">
                    <div class="caution-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <h4>⚠️ IMPORTANT SAFETY NOTICE</h4>
                            <p>The information provided is for educational purposes only. Always consult with a healthcare professional before trying any remedies or medications. Use at your own risk and care.</p>
                        </div>
                    </div>
                </div>
                <div class="remedy-error">
                    <p>Error loading remedies. Please try again.</p>
                </div>
            `;
            return;
        }
        
        // Clear and display remedies
        remediesContainer.innerHTML = `
            <div class="remedy-caution">
                <div class="caution-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>⚠️ IMPORTANT SAFETY NOTICE</h4>
                        <p>The information provided is for educational purposes only. Always consult with a healthcare professional before trying any remedies or medications. Use at your own risk and care.</p>
                    </div>
                </div>
            </div>
            <div class="remedy-search-info">
                <h3>Remedies for: "${symptoms}"</h3>
                <p class="remedy-disclaimer">Showing natural remedies and over-the-counter medicines. Always consult a doctor for proper diagnosis.</p>
            </div>
        `;
        
        if (!result.remedies || result.remedies.length === 0) {
            remediesContainer.innerHTML += `
                <div class="remedy-card">
                    <h3><i class="fas fa-info-circle"></i> No specific remedies found for "${symptoms}"</h3>
                    <p>Try searching for specific symptoms like: fever, headache, cough, stomach pain, etc.</p>
                    <div class="remedy-suggestions">
                        <h4>General Health Tips:</h4>
                        <ul>
                            <li>Stay hydrated by drinking plenty of water</li>
                            <li>Get adequate rest and sleep</li>
                            <li>Maintain a balanced diet</li>
                            <li>Practice good hygiene</li>
                            <li>Consult a healthcare professional for proper diagnosis</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        result.remedies.forEach(remedy => {
            const remedyCard = document.createElement('div');
            remedyCard.className = 'remedy-card';
            remedyCard.innerHTML = `
                <h3><i class="fas fa-stethoscope"></i> ${remedy.title}</h3>
                
                <div class="remedy-section">
                    <h4><i class="fas fa-leaf"></i> Natural Remedies</h4>
                    <div class="remedy-list">
                        <ul>
                            ${remedy.remedies.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section">
                    <h4><i class="fas fa-pills"></i> Over-the-Counter Medicines</h4>
                    <div class="medicine-list">
                        <ul>
                            ${remedy.medicines.map(item => `<li><i class="fas fa-capsules"></i> ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section">
                    <h4><i class="fas fa-utensils"></i> Dietary Recommendations</h4>
                    <div class="diet-list">
                        <ul>
                            ${remedy.dietary ? remedy.dietary.map(item => `<li><i class="fas fa-apple-alt"></i> ${item}</li>`).join('') : 
                            `<li><i class="fas fa-apple-alt"></i> Maintain a balanced diet</li>
                             <li><i class="fas fa-apple-alt"></i> Stay hydrated</li>
                             <li><i class="fas fa-apple-alt"></i> Avoid processed foods</li>`}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section">
                    <h4><i class="fas fa-hand-holding-heart"></i> Self-Care Tips</h4>
                    <div class="selfcare-list">
                        <ul>
                            ${remedy.selfcare ? remedy.selfcare.map(item => `<li><i class="fas fa-heart"></i> ${item}</li>`).join('') : 
                            `<li><i class="fas fa-heart"></i> Get plenty of rest</li>
                             <li><i class="fas fa-heart"></i> Practice stress management</li>
                             <li><i class="fas fa-heart"></i> Monitor your symptoms</li>`}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-warning">
                    <h4><i class="fas fa-exclamation-circle"></i> Important Warning</h4>
                    <p>${remedy.warning}</p>
                    <div class="warning-tips">
                        <p><strong>When to see a doctor:</strong></p>
                        <ul>
                            <li>Symptoms persist for more than 3 days</li>
                            <li>High fever (above 102°F/39°C)</li>
                            <li>Difficulty breathing</li>
                            <li>Severe pain</li>
                            <li>Symptoms worsen despite treatment</li>
                        </ul>
                    </div>
                </div>
            `;
            remediesContainer.appendChild(remedyCard);
        });
        
        // Add footer note
        const footerNote = document.createElement('div');
        footerNote.className = 'remedy-footer';
        footerNote.innerHTML = `
            <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> These remedies are general recommendations. Individual needs may vary. Always consult with a healthcare provider for personalized advice.</p>
        `;
        remediesContainer.appendChild(footerNote);
        
    } catch (error) {
        console.error('Display remedies error:', error);
        const remediesContainer = document.getElementById('remedies-container');
        if (remediesContainer) {
            remediesContainer.innerHTML = `
                <div class="remedy-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Remedies</h3>
                    <p>Failed to load remedies information. Please try again.</p>
                </div>
            `;
        }
    }
}

// Search remedies from symptoms input
function searchRemedies() {
    const symptoms = document.getElementById('symptoms-input').value.trim();
    if (symptoms) {
        displayRemedies(symptoms);
    } else {
        alert('Please enter symptoms to search for remedies.');
    }
}

// Make function available globally
window.displayRemedies = displayRemedies;
window.searchRemedies = searchRemedies;
