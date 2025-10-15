document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    function validateUsername(username) {
        if (username.trim() === "") {
            showError("Username cannot be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        if (!regex.test(username)) {
            showError("Invalid username format");
            return false;
        }
        return true;
    }

    function showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.user-container').appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 3000);
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            statsContainer.classList.remove('active');

            const graphql = JSON.stringify({
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username: username }
            });

            const requestOptions = {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: graphql,
            };

            // Using CORS Anywhere proxy
            const proxyUrl = 'https://cors-anywhere.herokuapp.com';
            const targetUrl = 'https://leetcode.com/graphql/';
            const response = await fetch(`${proxyUrl}/${targetUrl}`, requestOptions);

            if (!response.ok) {
                throw new Error(`Unable to fetch data (Status: ${response.status}). Make sure you've enabled CORS access.`);
            }
            
            const parsedData = await response.json();
            
            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error(`User "${username}" not found on LeetCode`);
            }
            
            displayUserData(parsedData);
        } catch (error) {
            showError(error.message || 'Failed to fetch user data. Please check CORS access.');
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        const progressDegree = (solved / total) * 100;
        if (circle) circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        if (label) label.textContent = `${solved}/${total}`;
    }

    function displayUserData(parsedData) {
        const totalEasyQues = parsedData.data.allQuestionsCount[1]?.count || 0;
        const totalMediumQues = parsedData.data.allQuestionsCount[2]?.count || 0;
        const totalHardQues = parsedData.data.allQuestionsCount[3]?.count || 0;

        const solvedTotalEasyQues = parsedData.data.matchedUser?.submitStats?.acSubmissionNum[1]?.count || 0;
        const solvedTotalMediumQues = parsedData.data.matchedUser?.submitStats?.acSubmissionNum[2]?.count || 0;
        const solvedTotalHardQues = parsedData.data.matchedUser?.submitStats?.acSubmissionNum[3]?.count || 0;

        updateProgress(solvedTotalEasyQues, totalEasyQues, easyLabel, easyProgressCircle);
        updateProgress(solvedTotalMediumQues, totalMediumQues, mediumLabel, mediumProgressCircle);
        updateProgress(solvedTotalHardQues, totalHardQues, hardLabel, hardProgressCircle);

        const cardsData = [
            { label: "Total Submissions", value: parsedData.data.matchedUser?.submitStats?.totalSubmissionNum[0]?.submissions || 0 },
            { label: "Easy Submissions", value: parsedData.data.matchedUser?.submitStats?.totalSubmissionNum[1]?.submissions || 0 },
            { label: "Medium Submissions", value: parsedData.data.matchedUser?.submitStats?.totalSubmissionNum[2]?.submissions || 0 },
            { label: "Hard Submissions", value: parsedData.data.matchedUser?.submitStats?.totalSubmissionNum[3]?.submissions || 0 },
        ];

        cardStatsContainer.innerHTML = cardsData.map(data => `
            <div class="card">
                <h4>${data.label}</h4>
                <p>${data.value}</p>
            </div>
        `).join("");

        statsContainer.classList.add('active');
    }

    searchButton.addEventListener('click', function() {
        const username = usernameInput.value;
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const username = usernameInput.value;
            if (validateUsername(username)) {
                fetchUserDetails(username);
            }
        }
    });
});