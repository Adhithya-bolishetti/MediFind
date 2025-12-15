// Natural remedies and medicine suggestions
const remediesDatabase = {
    'fever': {
        title: 'Fever Remedies',
        remedies: [
            'Drink plenty of fluids (water, herbal tea)',
            'Take rest and avoid exertion',
            'Use a cool compress on forehead',
            'Take a lukewarm bath',
            'Drink ginger or tulsi tea'
        ],
        medicines: [
            'Paracetamol (Acetaminophen) - 500mg every 6 hours',
            'Ibuprofen - 200-400mg every 6-8 hours',
            'Aspirin (for adults only) - 325-650mg every 4 hours'
        ],
        warning: 'If fever persists for more than 3 days or exceeds 103°F, consult a doctor.'
    },
    'cold': {
        title: 'Common Cold Remedies',
        remedies: [
            'Drink warm water with honey and lemon',
            'Steam inhalation with eucalyptus oil',
            'Gargle with warm salt water',
            'Drink turmeric milk before bed',
            'Rest and stay hydrated'
        ],
        medicines: [
            'Cetirizine (Antihistamine) - 10mg once daily',
            'Phenylephrine (Decongestant) - 10mg every 4 hours',
            'Dextromethorphan (Cough suppressant) - 15-30mg every 4-6 hours'
        ],
        warning: 'If symptoms persist beyond 7-10 days, consult a doctor.'
    },
    'cough': {
        title: 'Cough Remedies',
        remedies: [
            'Honey with warm water or tea',
            'Ginger tea with honey',
            'Steam inhalation',
            'Salt water gargle',
            'Thyme tea (natural expectorant)'
        ],
        medicines: [
            'Guaifenesin (Expectorant) - 200-400mg every 4 hours',
            'Dextromethorphan (Cough suppressant) - 15-30mg every 4-6 hours',
            'Benzonatate - 100-200mg three times daily'
        ],
        warning: 'If cough persists for more than 3 weeks or includes blood, see a doctor.'
    },
    'headache': {
        title: 'Headache Remedies',
        remedies: [
            'Apply cold compress to forehead',
            'Drink plenty of water',
            'Practice relaxation techniques',
            'Massage temples gently',
            'Rest in a dark, quiet room'
        ],
        medicines: [
            'Ibuprofen - 200-400mg every 4-6 hours',
            'Paracetamol - 500mg every 6 hours',
            'Aspirin - 325-650mg every 4 hours',
            'Naproxen - 220mg every 8-12 hours'
        ],
        warning: 'For severe, sudden headaches or those with vision changes, seek immediate medical attention.'
    },
    'sore throat': {
        title: 'Sore Throat Remedies',
        remedies: [
            'Salt water gargle (1/2 tsp salt in warm water)',
            'Honey and lemon in warm water',
            'Chamomile tea',
            'Licorice root gargle',
            'Stay hydrated with warm liquids'
        ],
        medicines: [
            'Lozenges with benzocaine or menthol',
            'Ibuprofen or Paracetamol for pain',
            'Chloraseptic spray for temporary relief'
        ],
        warning: 'If sore throat persists beyond 5-7 days or includes high fever, see a doctor.'
    },
    'stomach ache': {
        title: 'Stomach Pain Remedies',
        remedies: [
            'Drink ginger or peppermint tea',
            'Apply warm compress to abdomen',
            'BRAT diet (Bananas, Rice, Applesauce, Toast)',
            'Stay hydrated with clear liquids',
            'Avoid spicy, fatty, or dairy foods'
        ],
        medicines: [
            'Antacids (Tums, Rolaids) as directed',
            'Simethicone for gas relief',
            'Loperamide for diarrhea (short-term use)'
        ],
        warning: 'For severe abdominal pain, vomiting blood, or black stools, seek emergency care.'
    },
    'diarrhea': {
        title: 'Diarrhea Remedies',
        remedies: [
            'Stay hydrated with ORS solution',
            'BRAT diet (Bananas, Rice, Applesauce, Toast)',
            'Drink coconut water',
            'Avoid dairy and fatty foods',
            'Rest the digestive system'
        ],
        medicines: [
            'Loperamide - 4mg initially, then 2mg after each loose stool',
            'Bismuth subsalicylate - 524mg every 30-60 minutes',
            'Probiotics to restore gut flora'
        ],
        warning: 'If diarrhea persists beyond 2 days or includes blood, consult a doctor.'
    },
    'constipation': {
        title: 'Constipation Remedies',
        remedies: [
            'Drink plenty of water (8-10 glasses daily)',
            'Increase fiber intake (fruits, vegetables)',
            'Exercise regularly',
            'Drink warm water in the morning',
            'Prune or pear juice'
        ],
        medicines: [
            'Psyllium husk (Metamucil) - 1 tsp in water daily',
            'Docusate sodium (stool softener) - 100mg twice daily',
            'Bisacodyl (stimulant laxative) - 5-15mg as needed'
        ],
        warning: 'If constipation persists for more than 2 weeks, consult a doctor.'
    },
    'allergy': {
        title: 'Allergy Remedies',
        remedies: [
            'Use saline nasal spray',
            'Keep windows closed during high pollen seasons',
            'Use air purifiers',
            'Shower after being outdoors',
            'Wash bedding frequently in hot water'
        ],
        medicines: [
            'Cetirizine - 10mg once daily',
            'Loratadine - 10mg once daily',
            'Fexofenadine - 60mg twice daily or 180mg once daily',
            'Fluticasone nasal spray'
        ],
        warning: 'For severe allergic reactions (difficulty breathing, swelling), seek emergency care.'
    },
    'insomnia': {
        title: 'Sleep Issues Remedies',
        remedies: [
            'Establish regular sleep schedule',
            'Avoid screens 1 hour before bed',
            'Drink chamomile or valerian tea',
            'Practice relaxation techniques',
            'Keep bedroom cool and dark'
        ],
        medicines: [
            'Diphenhydramine (Benadryl) - 25-50mg at bedtime',
            'Doxylamine - 25mg at bedtime',
            'Melatonin - 1-5mg 30 minutes before bed'
        ],
        warning: 'If insomnia persists for more than 2 weeks, consult a doctor.'
    }
};

// Function to find remedies for symptoms
function findRemedies(symptomsText) {
    const symptoms = symptomsText.toLowerCase();
    const foundRemedies = [];
    
    Object.keys(remediesDatabase).forEach(key => {
        if (symptoms.includes(key)) {
            foundRemedies.push(remediesDatabase[key]);
        }
    });
    
    // If no specific match found, provide general advice
    if (foundRemedies.length === 0) {
        return [{
            title: 'General Health Advice',
            remedies: [
                'Stay hydrated by drinking plenty of water',
                'Get adequate rest and sleep',
                'Maintain a balanced diet with fruits and vegetables',
                'Practice good hygiene and hand washing',
                'Consider over-the-counter pain relief if needed'
            ],
            medicines: [
                'Paracetamol (Acetaminophen) for general pain/fever',
                'Ibuprofen for inflammation and pain',
                'Consult pharmacist for specific symptom relief'
            ],
            warning: 'If symptoms persist or worsen, consult a healthcare professional.'
        }];
    }
    
    return foundRemedies;
}

// Display remedies in the UI
function displayRemedies(symptomsText) {
    const remediesContainer = document.getElementById('remedies-container');
    if (!remediesContainer) return;
    
    const remedies = findRemedies(symptomsText);
    
    remediesContainer.innerHTML = '';
    
    remedies.forEach((remedy, index) => {
        const remedyCard = document.createElement('div');
        remedyCard.className = 'remedy-card';
        remedyCard.innerHTML = `
            <h3><i class="fas fa-leaf"></i> ${remedy.title}</h3>
            
            <div class="remedy-section">
                <h4><i class="fas fa-home"></i> Natural Remedies</h4>
                <ul>
                    ${remedy.remedies.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="remedy-section">
                <h4><i class="fas fa-pills"></i> Over-the-Counter Medicines</h4>
                <ul>
                    ${remedy.medicines.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="remedy-warning">
                <h4><i class="fas fa-exclamation-triangle"></i> Important Notice</h4>
                <p>${remedy.warning}</p>
                <p class="disclaimer">Disclaimer: This information is for educational purposes only. Consult a healthcare professional before taking any medication.</p>
            </div>
        `;
        
        remediesContainer.appendChild(remedyCard);
    });
}