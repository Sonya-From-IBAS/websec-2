$(document).ready(function () {
    let myData;
    let currentUrl = '/rasp?groupId=1282690279';
    let currentWeek = '32';
    let myDate = new Date();
    let day = myDate.getDay();

    var currentDate = new Date();
    $('#current-date').text(currentDate.toLocaleDateString('ru-RU'));
    $('#current_week').text(currentWeek + ' неделя');

    $.getJSON('/groups', function (data) {
        console.log(data);
        let $searchList = $('#search-list');
        data = JSON.parse(data);
        const entries = Object.entries(data);

        entries.forEach(([key, value]) => {
            let $group = $('<option></option>').val(key).text(value);
            $searchList.append($group);
        });

        let $inputElem = $('#search-input');
        $inputElem.on('change', function () {
            for (const [key, value] of entries) {
                let tmpTag = $('<div></div>').html(value);
                let tmpLink = tmpTag.find('a').attr('href');
                if ($inputElem.val() === key) {
                    updateData(tmpLink);
                    $('.schedule-title').html(key);
                    return false;
                }
            }
        });
    });

    $.getJSON('/teachers', function (data) {
        console.log(data);
        let $groupsList = $('#search-list');
        data = JSON.parse(data);
        const entries = Object.entries(data);

        entries.forEach(([key, value]) => {
            let $group = $('<option></option>').val(key).text(value);
            $groupsList.append($group);
        });

        let $inputElem = $('#search-input');
        $inputElem.on('change', function () {
            for (const [key, value] of entries) {
                if ($inputElem.val() === key) {
                    updateData(value);
                    $('.schedule-title').html(key);
                    return;
                }
            }
        });
    });

    function updateData(url = '/rasp?groupId=1282690279') {
        $.getJSON(url, function (data) {
            console.log(data);
            data = JSON.parse(data);
            currentWeek = data['week'];
            currentWeek = currentWeek.slice(0, 3).replace(/s/g, '');
            delete data['week'];
            myData = data;
            currentUrl += '&selectedWeek=' + currentWeek;
            generateTable();
        });
    }

    let rows = [];

    function generateTable(changeDay = false, nextDay = false) {
        let $table = $('.schedule-table');
        $table.empty();

        let $headers = $('<tr></tr>').addClass('headers-row');
        rows = [];

        for (let i = 0; i < 6; i++) {
            rows.push($('<tr></tr>'));
        }

        let resultSchedule = {};

        $headers.append($('<td></td>').text('Время'));
        if (changeDay) {
            nextDay
                ? day === 6
                    ? (day = 1)
                    : day++
                : day === 1
                ? (day = 6)
                : day--;
        }

        if ($(window).width() < 481) {
            switch (day) {
                case 0:
                case 1:
                    $headers.append($('<td></td>').text('Понедельник'));
                    resultSchedule['monday'] = myData['monday'];
                    break;
                case 2:
                    $headers.append($('<td></td>').text('Вторник'));
                    resultSchedule['tuesday'] = myData['tuesday'];
                    break;
                case 3:
                    $headers.append($('<td></td>').text('Среда'));
                    resultSchedule['wednesday'] = myData['wednesday'];
                    break;
                case 4:
                    $headers.append($('<td></td>').text('Четверг'));
                    resultSchedule['thursday'] = myData['thursday'];
                    break;
                case 5:
                    $headers.append($('<td></td>').text('Пятница'));
                    resultSchedule['friday'] = myData['friday'];
                    break;
                case 6:
                    $headers.append($('<td></td>').text('Суббота'));
                    resultSchedule['saturday'] = myData['saturday'];
                    break;
            }
        } else {
            $headers.append(
                $('<td></td>').text('Понедельник'),
                $('<td></td>').text('Вторник'),
                $('<td></td>').text('Среда'),
                $('<td></td>').text('Четверг'),
                $('<td></td>').text('Пятница'),
                $('<td></td>').text('Суббота')
            );
        }

        $table.append($headers);

        let ind = 0;
        for (let i of myData['monday']) {
            rows[ind].append($('<td></td>').text(Object.keys(i)[0] + ''));
            ind++;
        }

        ind = 0;
        for (const [key, value] of Object.entries(
            $(window).width() < 481 ? resultSchedule : myData
        )) {
            for (let i of value) {
                let $day = $('<div></div>').html(
                    value[ind][Object.keys(value[ind])[0]]
                );
                rows[ind].append($('<td></td>').append($day));
                ind++;
            }
            ind = 0;
        }

        $('a').each(function () {
            let hrefLink = $(this).attr('href');
            $(this)
                .attr('href', '#')
                .on('click', function () {
                    currentUrl = hrefLink;
                    updateData(currentUrl);
                });
        });

        for (let row of rows) {
            $table.append(row);
        }
    }

    updateData();

    $(window).on('resize', function () {
        for (let i = 0; i < rows.length; i++) {
            $(rows[i]).html('');
        }
        $('.headers-row').html('');
        generateTable();
    });

    $('#nextWeek').on('click', function () {
        let isWeekSelectedInURL = false;

        for (let char of currentUrl) {
            if (char === '&') {
                isWeekSelectedInURL = true;
                break;
            }
        }
    });

    function changePage(goNextPage) {
        let ind = 0;
        let $previousBtn = $('#previousWeek');
        ind = currentUrl.indexOf('=', currentUrl.indexOf('=') + 1);
        currentWeek = (
            parseInt(currentWeek) + (goNextPage ? 1 : -1)
        ).toString();
        $previousBtn.css(
            'visibility',
            currentWeek === '1' ? 'hidden' : 'visible'
        );
        currentUrl = currentUrl.slice(0, ind + 1) + currentWeek;
        $('#current_week').text(currentWeek + ' неделя');
        updateData(currentUrl);
        console.log(currentUrl);
    }

    $('#previousDay').on('click', function () {
        generateTable(true, false);
    });
    $('#nextDay').on('click', function () {
        generateTable(true, true);
    });
    $('#previousWeek').on('click', function () {
        changePage(false);
    });

    $('#nextWeek').on('click', function () {
        changePage(true);
    });
});
