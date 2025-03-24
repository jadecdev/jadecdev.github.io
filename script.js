document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let candidates = [];
    let votes = [];
    
    // Éléments DOM
    const candidateInput = document.getElementById('candidate-input');
    const addCandidateBtn = document.getElementById('add-candidate');
    const candidatesList = document.getElementById('candidates');
    const startVoteBtn = document.getElementById('start-vote');
    const setupSection = document.getElementById('setup-section');
    const votingSection = document.getElementById('voting-section');
    const resultsSection = document.getElementById('results-section');
    const rankingList = document.getElementById('ranking');
    const submitVoteBtn = document.getElementById('submit-vote');
    const voterNameInput = document.getElementById('voter-name');
    const computeResultsBtn = document.getElementById('compute-results');
    const pairwiseTable = document.getElementById('pairwise-table');
    const winnerText = document.getElementById('winner-text');
    const finalRanking = document.getElementById('final-ranking');
    const newVoteBtn = document.getElementById('new-vote');
    
    // Ajouter un candidat
    addCandidateBtn.addEventListener('click', function() {
        const candidateName = candidateInput.value.trim();
        if (candidateName && !candidates.includes(candidateName)) {
            candidates.push(candidateName);
            renderCandidatesList();
            candidateInput.value = '';
        } else if (candidates.includes(candidateName)) {
            alert('Ce candidat existe déjà !');
        }
    });
    
    // Supprimer un candidat
    function deleteCandidate(index) {
        candidates.splice(index, 1);
        renderCandidatesList();
    }
    
    // Afficher la liste des candidats
    function renderCandidatesList() {
        candidatesList.innerHTML = '';
        candidates.forEach((candidate, index) => {
            const li = document.createElement('li');
            li.textContent = candidate;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => deleteCandidate(index));
            
            li.appendChild(deleteBtn);
            candidatesList.appendChild(li);
        });
    }
    
    // Commencer le vote
    startVoteBtn.addEventListener('click', function() {
        if (candidates.length < 2) {
            alert('Ajoutez au moins 2 candidats pour commencer le vote.');
            return;
        }
        
        setupSection.classList.add('hidden');
        votingSection.classList.remove('hidden');
        
        // Afficher les candidats pour le classement
        rankingList.innerHTML = '';
        candidates.forEach(candidate => {
            const li = document.createElement('li');
            li.textContent = candidate;
            li.setAttribute('draggable', 'true');
            rankingList.appendChild(li);
        });
        
        // Activer le glisser-déposer
        enableDragAndDrop();
    });
    
    // Activer le glisser-déposer pour le classement
    function enableDragAndDrop() {
        const items = rankingList.querySelectorAll('li');
        
        items.forEach(item => {
            item.addEventListener('dragstart', function() {
                this.classList.add('dragging');
            });
            
            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
            });
        });
        
        rankingList.addEventListener('dragover', function(e) {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            const afterElement = getDragAfterElement(rankingList, e.clientY);
            
            if (afterElement == null) {
                rankingList.appendChild(dragging);
            } else {
                rankingList.insertBefore(dragging, afterElement);
            }
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Soumettre un vote
    submitVoteBtn.addEventListener('click', function() {
        const ranking = Array.from(rankingList.querySelectorAll('li')).map(li => li.textContent);
        const voterName = voterNameInput.value.trim() || `Votant ${votes.length + 1}`;
        
        votes.push({
            voter: voterName,
            ranking: ranking
        });
        
        alert(`Vote de ${voterName} enregistré !`);
        
        // Réinitialiser le formulaire de vote
        voterNameInput.value = '';
        
        // Passer aux résultats après le vote
        votingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    });
    
    // Calculer les résultats
    computeResultsBtn.addEventListener('click', function() {
        if (votes.length === 0) {
            alert('Aucun vote n\'a été enregistré !');
            return;
        }
        
        // Calculer la matrice des duels
        const pairwiseMatrix = calculatePairwiseMatrix();
        
        // Afficher la matrice des duels
        renderPairwiseTable(pairwiseMatrix);
        
        // Déterminer le vainqueur de Condorcet
        const winner = findCondorcetWinner(pairwiseMatrix);
        
        // Afficher le vainqueur
        if (winner) {
            winnerText.textContent = `Le vainqueur de Condorcet est : ${winner}`;
        } else {
            winnerText.textContent = "Il n'y a pas de vainqueur de Condorcet (paradoxe de Condorcet).";
        }
        
        // Calculer le classement final (méthode de Schulze)
        const finalRankingOrder = calculateSchulzeRanking(pairwiseMatrix);
        
        // Afficher le classement final
        renderFinalRanking(finalRankingOrder);
    });
    
    // Calculer la matrice des duels
    function calculatePairwiseMatrix() {
        const matrix = {};
        
        // Initialiser la matrice
        candidates.forEach(candidate1 => {
            matrix[candidate1] = {};
            candidates.forEach(candidate2 => {
                if (candidate1 !== candidate2) {
                    matrix[candidate1][candidate2] = 0;
                }
            });
        });
        
        // Remplir la matrice avec les résultats des duels
        votes.forEach(vote => {
            const ranking = vote.ranking;
            
            for (let i = 0; i < ranking.length; i++) {
                for (let j = i + 1; j < ranking.length; j++) {
                    const preferred = ranking[i];
                    const less = ranking[j];
                    
                    matrix[preferred][less]++;
                }
            }
        });
        
        return matrix;
    }
    
    // Afficher la matrice des duels
    function renderPairwiseTable(matrix) {
        pairwiseTable.innerHTML = '';
        
        // Créer l'en-tête
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = '';
        headerRow.appendChild(emptyHeader);
        
        candidates.forEach(candidate => {
            const th = document.createElement('th');
            th.textContent = candidate;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        pairwiseTable.appendChild(thead);
        
        // Créer le corps du tableau
        const tbody = document.createElement('tbody');
        
        candidates.forEach(candidate1 => {
            const row = document.createElement('tr');
            
            const rowHeader = document.createElement('th');
            rowHeader.textContent = candidate1;
            row.appendChild(rowHeader);
            
            candidates.forEach(candidate2 => {
                const cell = document.createElement('td');
                
                if (candidate1 === candidate2) {
                    cell.textContent = '-';
                } else {
                    const wins = matrix[candidate1][candidate2] || 0;
                    const losses = matrix[candidate2][candidate1] || 0;
                    cell.textContent = `${wins} - ${losses}`;
                    
                    if (wins > losses) {
                        cell.classList.add('winner');
                    }
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        pairwiseTable.appendChild(tbody);
    }
    
    // Trouver le vainqueur de Condorcet
    function findCondorcetWinner(matrix) {
        for (const candidate1 of candidates) {
            let isWinner = true;
            
            for (const candidate2 of candidates) {
                if (candidate1 !== candidate2) {
                    const wins = matrix[candidate1][candidate2] || 0;
                    const losses = matrix[candidate2][candidate1] || 0;
                    
                    if (wins <= losses) {
                        isWinner = false;
                        break;
                    }
                }
            }
            
            if (isWinner) {
                return candidate1;
            }
        }
        
        return null;
    }
    
    // Calculer le classement selon la méthode de Schulze
    function calculateSchulzeRanking(matrix) {
        // Créer la matrice des chemins les plus forts
        const paths = {};
        candidates.forEach(candidate1 => {
            paths[candidate1] = {};
            candidates.forEach(candidate2 => {
                if (candidate1 !== candidate2) {
                    const wins = matrix[candidate1][candidate2] || 0;
                    const losses = matrix[candidate2][candidate1] || 0;
                    
                    if (wins > losses) {
                        paths[candidate1][candidate2] = wins;
                    } else {
                        paths[candidate1][candidate2] = 0;
                    }
                }
            });
        });
        
        // Calculer les chemins les plus forts
        candidates.forEach(i => {
            candidates.forEach(j => {
                if (i !== j) {
                    candidates.forEach(k => {
                        if (i !== k && j !== k) {
                            paths[j][k] = Math.max(
                                paths[j][k],
                                Math.min(paths[j][i], paths[i][k])
                            );
                        }
                    });
                }
            });
        });
        
        // Déterminer le classement
        const ranking = [...candidates];
        ranking.sort((a, b) => {
            if (a === b) return 0;
            
            if (paths[a][b] > paths[b][a]) {
                return -1;
            } else if (paths[a][b] < paths[b][a]) {
                return 1;
            } else {
                return 0;
            }
        });
        
        return ranking;
    }
    
    // Afficher le classement final
    function renderFinalRanking(ranking) {
        finalRanking.innerHTML = '';
        
        ranking.forEach(candidate => {
            const li = document.createElement('li');
            li.textContent = candidate;
            finalRanking.appendChild(li);
        });
    }
    
    // Nouveau vote
    newVoteBtn.addEventListener('click', function() {
        votes = [];
        resultsSection.classList.add('hidden');
        setupSection.classList.remove('hidden');
        pairwiseTable.innerHTML = '';
        winnerText.textContent = '';
        finalRanking.innerHTML = '';
    });
});
