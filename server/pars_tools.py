import requests
from bs4 import BeautifulSoup
import json
import logging
import re

logging.basicConfig(level=logging.INFO)


def create_schedule(info, times, week):
    logging.debug("Создание расписания...")
    schedule = {
        "monday": [],
        "tuesday": [],
        "wednesday": [],
        "thursday": [],
        "friday": [],
        "saturday": []
    }

    index = 7
    for time in times:
        for day in schedule:
            if index < len(info):
                schedule[day].append({time: info[index]})
                index += 1

    schedule["week"] = week
    return schedule


def get_course_groups():
    result = {}
    try:
        for i in range(1, 6):
            html = requests.get(
                f"https://ssau.ru/rasp/faculty/492430598?course={i}").text
            soup = BeautifulSoup(html, "lxml")
            groups = soup.find_all("a", class_="btn-text group-catalog__group")
            for group in groups:
                result[group.text.strip()] = str(group)
        logging.info("Группы успешно получены.")
    except Exception as e:
        logging.error(f"Ошибка при получении групп: {e}")
    return json.dumps(result)


def get_and_save_teachers():
    result = {}
    try:
        for i in range(1, 123):
            html = requests.get(
                f"https://ssau.ru/staff?page={i}", verify=False).text
            soup = BeautifulSoup(html, "lxml")
            teachers_list = soup.find_all("ul", class_="list-group")
            for teachers in teachers_list:
                all_teachers = teachers.find_all("a")
                for teacher in all_teachers:
                    id_match = re.findall(
                        r'staff/([0-9a-zA-Z-]+)', str(teacher))
                    if id_match:
                        result[teacher.text.strip()] = "/rasp?staffId=" + \
                            id_match[0]

        with open("server/teachers.txt", "w", encoding="utf-8") as stream:
            json.dump(result, stream, ensure_ascii=False)
        logging.info("Информация о преподавателях успешно сохранена.")
    except Exception as e:
        logging.error(f"Ошибка при получении преподавателей: {e}")


def get_source_html(url):
    result_url = 'https://ssau.ru/' + url
    try:
        html = requests.get(result_url, verify=False).text
        soup = BeautifulSoup(html, "lxml")

        info = []
        times = []

        subjects = soup.find_all("div", class_="schedule__item")
        time_elements = soup.find_all("div", class_="schedule__time")

        for subject in subjects:
            lesson_info = []
            lesson_names = subject.find_all("div", class_="body-text")
            places = subject.find_all(
                "div", class_="caption-text schedule__place")
            teachers_and_groups = subject.find_all("a", class_="caption-text")

            lesson_info.extend([lesson.text for lesson in lesson_names])
            lesson_info.extend([place.text for place in places])
            lesson_info.extend(
                [str(teacher_or_group) + "<br>" for teacher_or_group in teachers_and_groups])

            info.append(' '.join(lesson_info))

        times = [time.text for time in time_elements]

        current_week = ""
        week_element = soup.find(
            "span", class_="h3-text week-nav-current_week")
        if week_element:
            current_week = week_element.text

        return json.dumps(create_schedule(info, times, current_week))

    except Exception as e:
        logging.error(f"Ошибка при запросе к {result_url}: {e}")
        return json.dumps({"error": "Не удалось получить данные"})
