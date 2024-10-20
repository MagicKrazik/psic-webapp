document.addEventListener('DOMContentLoaded', function() {
    const appointmentsTable = document.getElementById('appointmentsTable');
    const appointmentsBody = document.getElementById('appointmentsBody');

    // Sorting functionality
    appointmentsTable.querySelectorAll('th').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.dataset.sort;
            const rows = Array.from(appointmentsBody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                let aValue = a.children[th.cellIndex].textContent;
                let bValue = b.children[th.cellIndex].textContent;
                
                if (sortBy === 'price') {
                    aValue = parseFloat(aValue.replace('$', ''));
                    bValue = parseFloat(bValue.replace('$', ''));
                    return aValue - bValue;
                } else if (sortBy === 'date') {
                    aValue = new Date(aValue.split('/').reverse().join('-'));
                    bValue = new Date(bValue.split('/').reverse().join('-'));
                    return aValue - bValue;
                } else {
                    return aValue.localeCompare(bValue);
                }
            });

            if (th.classList.contains('asc')) {
                rows.reverse();
                th.classList.remove('asc');
                th.classList.add('desc');
            } else {
                th.classList.remove('desc');
                th.classList.add('asc');
            }

            // Remove sorting classes from other headers
            appointmentsTable.querySelectorAll('th').forEach(otherTh => {
                if (otherTh !== th) {
                    otherTh.classList.remove('asc', 'desc');
                }
            });

            // Re-append sorted rows
            rows.forEach(row => appointmentsBody.appendChild(row));
        });
    });
});