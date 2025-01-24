let words = []; // Words array to store {word, hint, difficulty}
fetch('words.txt')
    .then(response => response.text())
    .then(text => {
        words = text.split('\n').map(line => {
            const [word, hint, difficulty] = line.split(', ');
            return { word: word.trim(), hint: hint.trim(), difficulty: parseInt(difficulty, 10) };
        });
    });

const hangmanParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
let currentWord, currentHint, currentDifficulty, mode, lives;
let guessedWords = [];
let wrongWord = '';
let currentPlayer = null;


// Function to start the game
function startGame(selectedMode) {
    mode = selectedMode;
    lives = 6;
    guessedWords = [];
    wrongWord = '';
    currentPlayer = { name: '', score: 0, hardestWord: '', mode }; // Player record
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    newWord();
    resetHangman();
    displayLetters();
}

// Load a new word
function newWord() {
    let randomIndex, wordData;
    do {
        randomIndex = Math.floor(Math.random() * words.length);
        wordData = words[randomIndex];
    } while (guessedWords.includes(wordData));
    currentWord = wordData.word;
    currentHint = wordData.hint;
    currentDifficulty = wordData.difficulty;


    document.getElementById('hint').textContent = '';
    document.getElementById('hint-button').disabled = false;
    document.getElementById('hint-button').classList.remove('disabled');

    if (mode === 'easy') {
        lives = 6
    }

    displayWord();
    resetButtons();
    displayLetters();
}

// Display the word as underscores
function displayWord() {
    const wordContainer = document.getElementById('word');
    wordContainer.innerHTML = currentWord.split('').map(() => '<span>_</span>').join(' ');
}

// Display letter buttons
function displayLetters() {
    const lettersContainer = document.getElementById('letters');
    lettersContainer.innerHTML = 'abcdefghijklmnopqrstuvwxyz'.split('')
        .map(letter => `<button onclick="guess(this, '${letter}')">${letter}</button>`).join(' ');
}

// Guess a letter
function guess(button, letter) {
    button.classList.add('disabled');
    button.disabled = true;

    const spans = document.getElementById('word').querySelectorAll('span');
    let correct = false;

    currentWord.split('').forEach((char, index) => {
        if (char === letter) {
            spans[index].innerHTML = letter;
            correct = true;
        }
    });

    if (!correct) {
        showHangmanPart();
        lives--;
        if (lives === 0) {
            wrongWord = currentWord; // Save the wrong word
            setTimeout(() => {
                gameOver();
            }, 250);
        }
    } else if (Array.from(spans).every(span => span.innerHTML !== '_')) {
        guessedWords.push({ word: currentWord, difficulty: currentDifficulty });
        if (!currentPlayer.hardestWord || currentDifficulty > currentPlayer.hardestWord.difficulty) {
            currentPlayer.hardestWord = currentWord;
        }
        currentPlayer.score += currentDifficulty * 10;
        setTimeout(() => {
            alert('Correct!');
            if (mode === 'easy') {
                resetHangman();
            }
            newWord();
        }, 300);
    }
}

function showHangmanPart() {
    const partIndex = 6 - lives;
    if (partIndex >= 0 && partIndex < hangmanParts.length) {
        document.getElementById(hangmanParts[partIndex]).style.display = 'block';
    }
}

function resetHangman() {
    hangmanParts.forEach(part => {
        document.getElementById(part).style.display = 'none';
    });
}

// Reset letter buttons
function resetButtons() {
    const buttons = document.querySelectorAll('#letters button');
    buttons.forEach(button => {
        button.classList.remove('clicked');
        button.disabled = false;
    });
}

// Show hint
function showHint() {
    document.getElementById('hint').textContent = `Hint: ${currentHint}`;
    document.getElementById('hint-button').disabled = true;
    document.getElementById('hint-button').classList.add('disabled');
}

// Show game over screen
function gameOver() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('wrong-word').textContent = `You lost! The word was: ${wrongWord}`;
}

// Save player details and move to leaderboard
function submitPlayer() {
    const playerName = document.getElementById('player-name').value.trim();
    currentPlayer.name = playerName;

    if (!playerName) {
        alert('Please enter your name before submitting.');
        return;
    }

    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({
        name: playerName,
        score: currentPlayer.score,
        hardestWord: currentPlayer.hardestWord,
        mode: currentPlayer.mode
    });
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    localStorage.setItem('currentPlayer', JSON.stringify({
        name: playerName,
        score: currentPlayer.score,
        hardestWord: currentPlayer.hardestWord
    }));

    displayLeaderboards();
}

// Display the leaderboards
function displayLeaderboards() {
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('leaderboard-screen').style.display = 'block';

    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const easyLeaderboard = leaderboard.filter(player => player.mode === 'easy');
    const hardLeaderboard = leaderboard.filter(player => player.mode === 'hard');

    bubbleSort(easyLeaderboard);
    bubbleSort(hardLeaderboard);

    renderLeaderboard('easy-leaderboard', easyLeaderboard);
    renderLeaderboard('hard-leaderboard', hardLeaderboard);
}

// Bubble sort the leaderboard
function bubbleSort(array) {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (array[j].score < array[j + 1].score) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
}

// Render the leaderboard
function renderLeaderboard(elementId, leaderboard) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    // Get the current player's details from localStorage
    const currentPlayerData = JSON.parse(localStorage.getItem('currentPlayer'));
    const currentPlayerName = currentPlayerData?.name;

    const topFive = leaderboard.slice(0, 5);
    topFive.forEach((player, index) => {
        const listItem = document.createElement('li');

        let rankStyle = '';
        if (index === 0) rankStyle = 'color: gold; font-weight: bold;';
        else if (index === 1) rankStyle = 'color: silver; font-weight: bold;';
        else if (index === 2) rankStyle = 'color: #CD7F32; font-weight: bold;';

        // Highlight the current player using their name, score, and hardest word
        if (player.name === currentPlayerName &&
            player.score === currentPlayerData.score &&
            player.hardestWord === currentPlayerData.hardestWord) {
            listItem.innerHTML = `
                <span style="${rankStyle}">${index + 1}.</span> 
                <span style="color: blue;">${player.name} - Score: ${player.score}, Hardest Word: ${player.hardestWord}</span>
            `;
        } else {
            listItem.innerHTML = `
                <span style="${rankStyle}">${index + 1}.</span> 
                ${player.name} - Score: ${player.score}, Hardest Word: ${player.hardestWord}
            `;
        }
        list.appendChild(listItem);
    });

    // Show the current player if they aren't in the top 5
    const currentPlayerIndex = leaderboard.findIndex(player =>
        player.name === currentPlayerName &&
        player.score === currentPlayerData.score &&
        player.hardestWord === currentPlayerData.hardestWord
    );
    if (currentPlayerIndex >= 5) {
        const currentPlayer = leaderboard[currentPlayerIndex];
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span style="color: blue;">${currentPlayerIndex + 1}.</span> 
            <span style="color: blue;">${currentPlayer.name} - Score: ${currentPlayer.score}, Hardest Word: ${currentPlayer.hardestWord}</span>
        `;
        list.appendChild(document.createElement('hr'));
        list.appendChild(listItem);
    }
}


// Clear the leaderboard with confirmation
function clearLeaderboard() {
    const confirmation = confirm("Are you sure you want to clear the leaderboard? This action cannot be undone!");
    if (confirmation) {
        // Clear leaderboard from localStorage
        localStorage.removeItem("leaderboard");

        // Update and display the empty leaderboard
        displayLeaderboards();
        alert("Leaderboard cleared successfully!");
    }
}

function showHowToPlay() {
    const modal = document.getElementById('how-to-play-popup');
    modal.style.display = 'block';
}

// Close the How to Play modal
function closeHowToPlay() {
    const modal = document.getElementById('how-to-play-popup');
    modal.style.display = 'none';
}

// Return to the Start Page with Confirmation
function returnToStart() {
    const confirmReset = confirm(
        "Are you sure you want to return to the start page? Your current game progress will be lost."
    );

    if (confirmReset) {
        // Hide the game container
        document.getElementById('game-container').style.display = 'none';

        // Show the start screen
        document.getElementById('start-screen').style.display = 'block';

        // Reset the game state
        resetHangman();
        resetButtons();
    }
}

// Show Leaderboard from Start Page
function viewLeaderboard() {
    // Hide the start screen
    document.getElementById('start-screen').style.display = 'none';

    // Show the leaderboard screen
    displayLeaderboards(); // This function already handles rendering the leaderboard
}

