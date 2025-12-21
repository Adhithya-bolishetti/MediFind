// Display remedies for symptoms
async function displayRemedies(symptoms) {
    console.log('Displaying remedies for:', symptoms);
    
    try {
        const remediesContainer = document.getElementById('remedies-container');
        if (!remediesContainer) return;
        
        // Show remedies section
        document.getElementById('remedies-section').style.display = 'block';
        
        // Add caution message and loading
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
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <h3>Loading remedies for "${symptoms}"...</h3>
                <p>Please wait while we fetch the best natural remedies and medicines for your symptoms.</p>
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
                    <i class="fas fa-exclamation-circle fa-3x"></i>
                    <h3>Error Loading Remedies</h3>
                    <p>${result.error}</p>
                    <button class="btn" onclick="displayRemedies('${symptoms}')">Try Again</button>
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
                <h2><i class="fas fa-stethoscope"></i> Remedies for: "${symptoms}"</h2>
                <p class="remedy-disclaimer"><i class="fas fa-info-circle"></i> Showing natural remedies and over-the-counter medicines. Always consult a doctor for proper diagnosis.</p>
            </div>
        `;
        
        if (!result.remedies || result.remedies.length === 0) {
            remediesContainer.innerHTML += `
                <div class="remedy-card">
                    <h3><i class="fas fa-info-circle"></i> No specific remedies found for "${symptoms}"</h3>
                    <p>Try searching for specific symptoms like: fever, headache, cough, stomach pain, etc.</p>
                    <div class="remedy-suggestions">
                        <h4><i class="fas fa-lightbulb"></i> General Health Tips:</h4>
                        <ul>
                            <li><i class="fas fa-check-circle"></i> Stay hydrated by drinking plenty of water</li>
                            <li><i class="fas fa-check-circle"></i> Get adequate rest and sleep (7-8 hours)</li>
                            <li><i class="fas fa-check-circle"></i> Maintain a balanced diet with fruits and vegetables</li>
                            <li><i class="fas fa-check-circle"></i> Practice good hygiene and hand washing</li>
                            <li><i class="fas fa-check-circle"></i> Consult a healthcare professional for proper diagnosis</li>
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
                
                <div class="remedy-section natural-remedies">
                    <h4><i class="fas fa-leaf"></i> Natural Remedies & Home Treatments</h4>
                    <div class="remedy-list">
                        <ul>
                            ${remedy.remedies.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section medicines">
                    <h4><i class="fas fa-pills"></i> Over-the-Counter Medicines</h4>
                    <div class="medicine-list">
                        <ul>
                            ${remedy.medicines.map(item => `<li><i class="fas fa-capsules"></i> ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section dietary">
                    <h4><i class="fas fa-utensils"></i> Dietary Recommendations</h4>
                    <div class="diet-list">
                        <ul>
                            ${(remedy.dietary && remedy.dietary.length > 0) ? 
                                remedy.dietary.map(item => `<li><i class="fas fa-apple-alt"></i> ${item}</li>`).join('') : 
                                `<li><i class="fas fa-apple-alt"></i> Maintain a balanced diet with plenty of fruits and vegetables</li>
                                 <li><i class="fas fa-apple-alt"></i> Stay hydrated with water, herbal teas, and soups</li>
                                 <li><i class="fas fa-apple-alt"></i> Avoid processed foods, caffeine, and alcohol</li>`
                            }
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-section selfcare">
                    <h4><i class="fas fa-hand-holding-heart"></i> Self-Care & Prevention</h4>
                    <div class="selfcare-list">
                        <ul>
                            ${(remedy.selfcare && remedy.selfcare.length > 0) ? 
                                remedy.selfcare.map(item => `<li><i class="fas fa-heart"></i> ${item}</li>`).join('') : 
                                `<li><i class="fas fa-heart"></i> Get plenty of rest and avoid physical exertion</li>
                                 <li><i class="fas fa-heart"></i> Practice stress management techniques</li>
                                 <li><i class="fas fa-heart"></i> Monitor your symptoms and track improvements</li>`
                            }
                        </ul>
                    </div>
                </div>
                
                <div class="remedy-warning">
                    <h4><i class="fas fa-exclamation-circle"></i> Important Warning & When to See a Doctor</h4>
                    <p class="warning-text">${remedy.warning}</p>
                    <div class="warning-tips">
                        <p><strong><i class="fas fa-ambulance"></i> Seek immediate medical attention if you experience:</strong></p>
                        <ul>
                            <li><i class="fas fa-exclamation-triangle"></i> Difficulty breathing or shortness of breath</li>
                            <li><i class="fas fa-exclamation-triangle"></i> Chest pain or pressure</li>
                            <li><i class="fas fa-exclamation-triangle"></i> Sudden dizziness or confusion</li>
                            <li><i class="fas fa-exclamation-triangle"></i> Severe or persistent pain</li>
                            <li><i class="fas fa-exclamation-triangle"></i> High fever (above 102°F/39°C) that doesn't respond to medication</li>
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
            <p><i class="fas fa-info-circle"></i> <strong>Disclaimer:</strong> This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before starting any treatment or making changes to your healthcare regimen.</p>
            <p class="footer-note"><i class="fas fa-phone-alt"></i> In case of emergency, call your local emergency number immediately.</p>
        `;
        remediesContainer.appendChild(footerNote);
        
    } catch (error) {
        console.error('Display remedies error:', error);
        const remediesContainer = document.getElementById('remedies-container');
        if (remediesContainer) {
            remediesContainer.innerHTML = `
                <div class="remedy-error">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Network Error</h3>
                    <p>Failed to load remedies information. Please check your internet connection and try again.</p>
                    <button class="btn" onclick="displayRemedies('${symptoms}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
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
