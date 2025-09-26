document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const habitsList = document.getElementById('habits-list');
    const newHabitInput = document.getElementById('new-habit-input');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const weekDisplay = document.getElementById('week-display');
    const gridHeader = document.getElementById('grid-header');
    const gridBody = document.getElementById('grid-body');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const streakPlaceholder = document.getElementById('streak-placeholder');
    const streakDisplay = document.getElementById('streak-display');
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');

    // App State
    let habits = [];
    let currentDate = new Date();
    let selectedHabitIndex = null;

    // --- UTILITY FUNCTIONS ---
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getWeekRange = (date) => {
        const start = new Date(date);
        const dayOfWeek = start.getDay(); // 0 for Sunday, 1 for Monday...
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to make Monday the start
        start.setDate(diff);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            dates.push(day);
        }
        return { start, end, dates };
    };

    // --- DATA HANDLING ---
    const loadHabits = () => {
        const storedHabits = localStorage.getItem('habits-weekly');
        if (storedHabits) {
            habits = JSON.parse(storedHabits);
        } else {
            habits = [
                { name: 'Exercise', completed: [] },
                { name: 'Read (20 mins)', completed: [] },
                { name: 'Drink Water (2L)', completed: [] }
            ];
        }
    };

    const saveHabits = () => {
        localStorage.setItem('habits-weekly', JSON.stringify(habits));
    };

    // --- RENDERING FUNCTIONS ---
    const renderApp = () => {
        renderHabitList();
        renderProgressGrid();
        updateStreakInfo();
    };

    const renderHabitList = () => {
        habitsList.innerHTML = '';
        habits.forEach((habit, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            if (index === selectedHabitIndex) {
                li.classList.add('selected-habit');
            }
            li.innerHTML = `
                <span>${habit.name}</span>
                <i class="fa-solid fa-trash-can delete-btn" data-index="${index}" title="Delete Habit"></i>
            `;
            habitsList.appendChild(li);
        });
    };

    const renderProgressGrid = () => {
        const { start, end, dates } = getWeekRange(currentDate);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        weekDisplay.textContent = `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

        gridHeader.innerHTML = '';
        gridBody.innerHTML = '';

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>HABIT</th>';
        dates.forEach(date => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            headerRow.innerHTML += `<th><div>${dayName}</div><div>${date.getDate()}</div></th>`;
        });
        gridHeader.appendChild(headerRow);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        habits.forEach((habit, habitIndex) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td class="habit-name">${habit.name}</td>`;
            dates.forEach(date => {
                const dateString = formatDate(date);
                const isCompleted = habit.completed.includes(dateString);
                const isFuture = date > today;
                
                let circleClass = 'status-circle';
                if (isCompleted) circleClass += ' completed';
                if (isFuture) circleClass += ' future';
                
                row.innerHTML += `<td><span class="${circleClass}" data-habit-index="${habitIndex}" data-date="${dateString}"></span></td>`;
            });
            gridBody.appendChild(row);
        });
    };

    const updateStreakInfo = () => {
        if (selectedHabitIndex === null || habits.length === 0) {
            streakPlaceholder.classList.remove('hidden');
            streakDisplay.classList.add('hidden');
            return;
        }

        streakPlaceholder.classList.add('hidden');
        streakDisplay.classList.remove('hidden');
        
        const habit = habits[selectedHabitIndex];
        const completedDates = habit.completed.map(d => new Date(d + "T00:00:00")).sort((a, b) => a - b);
        
        if (completedDates.length === 0) {
            currentStreakEl.textContent = '0';
            bestStreakEl.textContent = '0';
            return;
        }

        let bestStreak = 0;
        let currentStreak = 0;
        let tempStreak = 1;

        for (let i = 0; i < completedDates.length; i++) {
            if (i > 0) {
                const diff = (completedDates[i] - completedDates[i-1]) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    tempStreak++;
                } else {
                    bestStreak = Math.max(bestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak);

        // Calculate current streak
        const today = new Date();
        today.setHours(0,0,0,0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastCompletedDate = completedDates[completedDates.length - 1];
        if (lastCompletedDate.getTime() === today.getTime() || lastCompletedDate.getTime() === yesterday.getTime()) {
             let streak = 0;
             let dateToCheck = new Date(lastCompletedDate);
             let dateSet = new Set(habit.completed);

             while(dateSet.has(formatDate(dateToCheck))){
                streak++;
                dateToCheck.setDate(dateToCheck.getDate() - 1);
             }
             currentStreak = streak;
        }

        currentStreakEl.textContent = currentStreak;
        bestStreakEl.textContent = bestStreak;
    };


    // --- EVENT HANDLERS ---
    const handleAddHabit = () => {
        const habitName = newHabitInput.value.trim();
        if (habitName) {
            habits.push({ name: habitName, completed: [] });
            newHabitInput.value = '';
            saveHabits();
            renderApp();
        }
    };

    const handleHabitListClick = (e) => {
        const targetLi = e.target.closest('li');
        if (!targetLi) return;

        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            if (confirm(`Are you sure you want to delete "${habits[index].name}"?`)) {
                habits.splice(index, 1);
                if (selectedHabitIndex == index) selectedHabitIndex = null;
                else if (selectedHabitIndex > index) selectedHabitIndex--;
                saveHabits();
                renderApp();
            }
        } else {
            selectedHabitIndex = parseInt(targetLi.dataset.index);
            renderHabitList(); // Re-render to show selection
            updateStreakInfo();
        }
    };
    
    const handleGridClick = (e) => {
        if (e.target.classList.contains('status-circle') && !e.target.classList.contains('future')) {
            const habitIndex = e.target.dataset.habitIndex;
            const dateString = e.target.dataset.date;
            
            const habit = habits[habitIndex];
            const completedIndex = habit.completed.indexOf(dateString);

            if (completedIndex > -1) {
                habit.completed.splice(completedIndex, 1);
            } else {
                habit.completed.push(dateString);
            }
            
            saveHabits();
            renderProgressGrid(); // Only re-render grid for performance
            if (parseInt(habitIndex) === selectedHabitIndex) {
                 updateStreakInfo();
            }
        }
    };
    
    const handleClearAll = () => {
        if(confirm('WARNING: This will delete ALL habits and progress. Are you sure?')) {
            localStorage.removeItem('habits-weekly');
            habits = [];
            selectedHabitIndex = null;
            renderApp();
        }
    };

    // --- EVENT LISTENERS ---
    addHabitBtn.addEventListener('click', handleAddHabit);
    newHabitInput.addEventListener('keydown', (e) => e.key === 'Enter' && handleAddHabit());
    habitsList.addEventListener('click', handleHabitListClick);
    gridBody.addEventListener('click', handleGridClick);
    clearAllBtn.addEventListener('click', handleClearAll);

    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderProgressGrid();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderProgressGrid();
    });

    // --- INITIALIZATION ---
    loadHabits();
    renderApp();
});