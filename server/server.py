import os
import logging
from flask import Flask, send_from_directory, jsonify, request
from pars_tools import get_source_html, get_course_groups, get_and_save_teachers

app = Flask(__name__)
client_path = '../client'
logging.basicConfig(level=logging.INFO)


@app.route('/')
def index():
    return send_from_directory(client_path, 'index.html')


@app.route('/script.js')
def script():
    return send_from_directory(client_path, 'script.js')


@app.route('/style.css')
def style():
    return send_from_directory(client_path, 'style.css')


@app.route('/groups')
def groups():
    return jsonify(get_course_groups())


@app.route('/teachers')
def teachers():
    try:
        if not os.path.exists('server/teachers.txt'):
            get_and_save_teachers()

        with open('server/teachers.txt', 'r', encoding='utf-8') as file:
            return jsonify(file.read())
    except Exception as e:
        print(e)
        logging.error(f"Ошибка teachers: {e}")


@app.route('/<path:path>')
def get_html_route(path):
    group_id = request.args.get('groupId')
    selected_week = request.args.get('selectedWeek')
    if selected_week:
        response = get_source_html(f"{path}?groupId={group_id}&selectedWeek={selected_week}")
    else:
        response = get_source_html(f"{path}?groupId={group_id}")

    return jsonify(response)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=2000)
