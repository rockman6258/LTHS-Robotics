const SHEET_ID = "1EsJzNiMcFzNnSQti2QPl8b_KerfDFwRyla_7sihGZo8";

async function fetchCSV(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const csvText = await response.text();
        if (csvText.includes("<!DOCTYPE html>")) return [];
        return new Promise((resolve) => {
            Papa.parse(csvText, { header: true, skipEmptyLines: true, complete: function(results) { resolve(results.data); } });
        });
    } catch (error) {
        console.error(`Failed on tab: ${sheetName}`, error);
        return [];
    }
}

async function initData() {
    try {
        const [generalData, statsData, seasonsData, newsData, galleryData, sponsorsData, socialsData, compData, teamData] = await Promise.all([
            fetchCSV("General"), fetchCSV("Stats"), fetchCSV("Seasons"), 
            fetchCSV("Newsletters"), fetchCSV("Gallery"), fetchCSV("Sponsors"), 
            fetchCSV("Socials"), fetchCSV("Competitions"), fetchCSV("Teams")
        ]);

        // 1. General Settings (Hero, Footer, Donate Links)
        if (generalData.length > 0) {
            const config = {};
            generalData.forEach(row => { config[row['Setting Name']] = row['Value']; });
            
            // Safe checking for elements before filling them
            const elHeroTitle = document.getElementById('display-hero-title');
            if (elHeroTitle && config['Hero Title']) elHeroTitle.innerHTML = DOMPurify.sanitize(config['Hero Title']);
            
            const elHeroSub = document.getElementById('display-hero-subtitle');
            if (elHeroSub && config['Hero Subtitle']) elHeroSub.innerText = config['Hero Subtitle'];
            
            const elHeroBg = document.getElementById('hero');
            if (elHeroBg && config['Hero Image Link']) {
                const safeUrl = DOMPurify.sanitize(config['Hero Image Link']);
                elHeroBg.style.backgroundImage = `linear-gradient(to right, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.6)), url('${safeUrl}')`;
            }

            const elPhotoAlbum = document.getElementById('display-photo-album');
            if (elPhotoAlbum && config['Photo Album Link']) elPhotoAlbum.href = config['Photo Album Link'];
            
            const elSponsorName = document.getElementById('display-sponsor-name');
            if (elSponsorName && config['Club Sponsor Name']) elSponsorName.innerText = config['Club Sponsor Name'];
            
            const elSponsorEmail = document.getElementById('display-sponsor-email');
            let sEmail = config['Club Sponsor Email'] || '';
            if (elSponsorEmail) { elSponsorEmail.innerText = sEmail; elSponsorEmail.href = `mailto:${sEmail}`; }
            
            const elMediaEmail = document.getElementById('display-media-email');
            let mEmail = config['Media Contact Email'] || '';
            if (elMediaEmail) { elMediaEmail.innerText = mEmail; elMediaEmail.href = `mailto:${mEmail}`; }

            document.querySelectorAll('.dynamic-donate').forEach(btn => { 
                btn.href = config['Donation Link'] || '#'; 
                if(btn.classList.contains('btn-nav-sponsor') && (!btn.innerText || btn.innerText === '--')) {
                    btn.innerText = "Donate & Sponsor"; 
                }
            });

            const elCtaTitle = document.getElementById('display-cta-title');
            if (elCtaTitle && config['CTA Title']) elCtaTitle.innerText = config['CTA Title'];
            
            const elCtaDesc = document.getElementById('display-cta-desc');
            if (elCtaDesc && config['CTA Description']) elCtaDesc.innerHTML = DOMPurify.sanitize(config['CTA Description']);
            
            const elCtaBtn = document.getElementById('display-cta-btn');
            if (elCtaBtn && config['CTA Button Text']) elCtaBtn.innerText = config['CTA Button Text'];
            
            const elAboutDesc = document.getElementById('display-about-desc');
            if (elAboutDesc && config['About Description']) elAboutDesc.innerHTML = DOMPurify.sanitize(config['About Description']);
        }

        // Helper function for rendering Team Cards
        function renderTeams(dataArray, targetId) {
            const container = document.getElementById(targetId);
            if (!container || dataArray.length === 0) return;
            let html = '';
            dataArray.forEach(team => {
                let membersHTML = '';
                if (team['Members']) {
                    const membersList = team['Members'].split(',');
                    membersList.forEach(member => {
                        const parts = member.trim().split('-');
                        const name = parts[0] ? parts[0].trim() : '';
                        const role = parts[1] ? parts[1].trim() : '';
                        membersHTML += `<div class="member-item">${name} ${role ? `<span>• ${role}</span>` : ''}</div>`;
                    });
                }
                const imgHTML = team['Image URL'] ? `<img src="${team['Image URL']}" alt="${team['Team Name']} Photo">` : `<i data-lucide="bot" style="width: 48px; height: 48px; opacity: 0.2;"></i>`;
                html += `
                    <div class="team-card">
                        <div class="team-img-placeholder">${imgHTML}</div>
                        <div class="team-content">
                            <span class="badge badge-red">${team['Team Number']}</span>
                            ${team['Status'] ? `<span class="badge badge-dark">${team['Status']}</span>` : ''}
                            <h3 class="team-name">${team['Team Name']}</h3>
                            <div class="team-robot">Robot: <span>${team['Robot Name'] || 'TBD'}</span></div>
                            <div class="team-members-header"><i data-lucide="users"></i> Roster</div>
                            <div class="member-list">${membersHTML}</div>
                        </div>
                    </div>`;
            });
            container.innerHTML = DOMPurify.sanitize(html);
        }

        // Helper function for rendering Comp Cards
        function renderComps(dataArray, targetId) {
            const container = document.getElementById(targetId);
            if (!container || dataArray.length === 0) return;
            let html = '';
            dataArray.forEach(comp => {
                let compTeamsHTML = '';
                if (comp['Teams Attending']) {
                    const teamsList = comp['Teams Attending'].split(',');
                    teamsList.forEach(t => compTeamsHTML += `<span class="badge badge-outline">${t.trim()}</span>`);
                }
                html += `
                    <div class="comp-card">
                        <div>
                            <span class="badge badge-red">${comp['Type']}</span>
                            <span class="badge badge-dark">${comp['Status']}</span>
                        </div>
                        <h3 class="comp-name">${comp['Name']}</h3>
                        <div class="comp-detail"><i data-lucide="calendar"></i> ${comp['Date']}</div>
                        <div class="comp-detail"><i data-lucide="map-pin"></i> ${comp['Location']}</div>
                        <div class="comp-teams-list">${compTeamsHTML}</div>
                        ${comp['Results'] ? `<div class="comp-results"><i data-lucide="bar-chart-2"></i> <div>${comp['Results']}</div></div>` : ''}
                    </div>`;
            });
            container.innerHTML = DOMPurify.sanitize(html);
        }

        // Helper function for rendering News Cards
        function renderNews(dataArray, targetId) {
            const container = document.getElementById(targetId);
            if (!container || dataArray.length === 0) return;
            let html = '';
            dataArray.forEach(news => {
                html += `
                    <div class="news-card">
                        <span style="color: var(--lt-red); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${news['Tag']}</span>
                        <h3 style="font-size: 1.5rem; margin: 1rem 0;">${news['Title']}</h3>
                        <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem;">${news['Description']}</p>
                        <a href="${news['Link URL']}" target="_blank" class="btn-primary" style="font-size: 0.95rem; padding: 0.8rem 1.2rem;"><i data-lucide="external-link" style="width: 18px;"></i> Read Newsletter</a>
                    </div>`;
            });
            container.innerHTML = DOMPurify.sanitize(html);
        }

        // --- Render Target Elements Based on Page ---
        
        // Teams (Full list on archive, none on index)
        if (document.getElementById('display-all-teams')) renderTeams(teamData, 'display-all-teams');
        
        // Competitions (Preview on index, Full list on archive)
        if (document.getElementById('display-competitions')) renderComps(compData.slice(-3).reverse(), 'display-competitions');
        if (document.getElementById('display-all-competitions')) renderComps(compData.reverse(), 'display-all-competitions');
        
        // Newsletters (Preview on index, Full list on archive)
        if (document.getElementById('display-newsletters')) renderNews(newsData.slice(-3).reverse(), 'display-newsletters');
        if (document.getElementById('display-all-newsletters')) renderNews(newsData.reverse(), 'display-all-newsletters');

        // Stats
        const elStatsGrid = document.getElementById('display-stats-grid');
        if (elStatsGrid && statsData.length > 0) {
            let statsHTML = ''; let totalAwardsCount = 0;
            statsData.forEach(stat => {
                statsHTML += `<div class="stat-box"><div class="stat-num">${stat['Count']}</div><div class="stat-label">${stat['Award Name']}</div></div>`;
                let num = parseInt(stat['Count']); if (!isNaN(num)) totalAwardsCount += num; else totalAwardsCount += 1; 
            });
            elStatsGrid.innerHTML = DOMPurify.sanitize(statsHTML);
            document.getElementById('display-total-awards').innerText = totalAwardsCount + "+";
        }

        // Seasons History
        const elSeasons = document.getElementById('display-season-history');
        if (elSeasons && seasonsData.length > 0) {
            let seasonsHTML = '';
            seasonsData.forEach(season => { seasonsHTML += `<div class="season-row"><div class="season-year">${season['Season']}</div><div class="season-details">${season['Highlights']}</div></div>`; });
            elSeasons.innerHTML = DOMPurify.sanitize(seasonsHTML);
        }

        // Gallery
        const elGallery = document.getElementById('display-gallery');
        if (elGallery && galleryData.length > 0) {
            let galleryHTML = '';
            galleryData.forEach(slide => { galleryHTML += `<div class="gallery-item"><img src="${slide['Image URL']}" alt="${slide['Caption']}"><div class="gallery-caption">${slide['Caption']}</div></div>`; });
            elGallery.innerHTML = DOMPurify.sanitize(galleryHTML);
        }

        // Sponsors
        const elSponsors = document.getElementById('display-sponsors');
        if (elSponsors && sponsorsData.length > 0) {
            let sponsorsHTML = ''; const tiers = ['Titanium', 'Platinum', 'Gold', 'Silver'];
            tiers.forEach(tier => {
                const tierSponsors = sponsorsData.filter(s => s['Tier'] && s['Tier'].trim().toLowerCase() === tier.toLowerCase());
                if (tierSponsors.length > 0) {
                    sponsorsHTML += `<div class="sponsor-tier-section"><strong class="tier-${tier.toLowerCase()}">${tier} Sponsors</strong><div class="sponsor-grid">`;
                    tierSponsors.forEach(s => {
                        const logoElement = s['Logo URL'] ? `<img src="${s['Logo URL']}" alt="${s['Sponsor Name']} Logo" class="sponsor-logo">` : ``;
                        sponsorsHTML += `<a href="${s['Website URL']}" target="_blank" class="sponsor-card">${logoElement}<div class="sponsor-name">${s['Sponsor Name']}</div></a>`;
                    });
                    sponsorsHTML += `</div></div>`;
                }
            });
            elSponsors.innerHTML = DOMPurify.sanitize(sponsorsHTML);
        }

        // Socials
        const elSocials = document.getElementById('display-socials');
        if (elSocials && socialsData.length > 0) {
            let socialsHTML = '<h3>Connect With Us</h3>';
            socialsData.forEach(social => { socialsHTML += `<a href="${social['Link URL']}" target="_blank" class="social-link"><i data-lucide="${social['Icon Name']}"></i> ${social['Display Text']}</a>`; });
            elSocials.innerHTML = DOMPurify.sanitize(socialsHTML);
        }

        // Paint icons
        lucide.createIcons();

    } catch (error) {
        console.error("Error populating data: ", error);
    }
}

window.addEventListener('DOMContentLoaded', initData);