#!/usr/bin/python3
"""Test files for the endpoints"""
import requests as req
import json


base = "0.0.0.0:5000/"
email = "bob@dylan.com"
password = "toto1234!"
new_email = "email@corp.domain"
new_password = "new_toto1234!"
header = {"Content-Type": "application/json"}
token = None
temp_data = {"name": "myText.txt", "type": "file",
             "data": "SGVsbG8gV2Vic3RhY2shCg=="}


def test_status():
    """Tests status endpoint"""
    with req.get(base + "status") as marko:
        assert marko.status_code == 200
        assert isinstance(marko.json()["redis"], bool)
        assert isinstance(marko.json()["db"], bool)


def test_stats():
    """Tests stats endpoint"""
    with req.get(base + "stats") as marko:
        assert marko.status_code == 200
        assert isinstance(marko.json(), dict)
        assert isinstance(marko.json()["users"], int)
        assert isinstance(marko.json()["files"], int)


def test_users_new():
    """Tests users endpoint with new user"""
    with req.post(base + "users", headers=header,
                  data=json.dumps({"email": new_email,
                                   "password": new_password})) as marko:
        assert marko.status_code == 201
        assert isinstance(marko.json()["id"], str)
        assert isinstance(marko.json()["email"], str)


def test_users_old():
    """Tests users endpoint with old user"""
    with req.post(base + "users", headers=header,
                  data=json.dumps({"email": email,
                                   "password": password})) as marko:
        assert marko.status_code == 400
        payload = {"error": "Already exist"}
        assert marko.json() == payload


def test_user_no_password():
    """Tests users endpoint without email"""
    with req.post(base + "users", headers=header,
                  data=json.dumps({"email": email})) as marko:
        assert marko.status_code == 400
        payload = {"error": "Missing password"}
        assert marko.json() == payload


def test_user_no_email():
    """Tests users endpoint without email"""
    with req.post(base + "users", headers=header,
                  data=json.dumps({"password": password})) as marko:
        assert marko.status_code == 400
        payload = {"error": "Missing email"}
        assert marko.json() == payload


def test_connect():
    """Test connect endpoint"""
    auth_string = "Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE="
    with req.get(base + "connect",
                 headers={"Authorization": auth_string}) as marko:
        assert marko.status_code == 200
        assert isinstance(marko.json()["token"], str)
        token = marko.json().get("token")


def test_users_me():
    """Tests users/me endpoint"""
    with req.get(base + "users/me",
                 headers={"X-Token": token}) as marko:
        assert isinstance(marko.json()["id"], str)
        assert isinstance(marko.json()["email"], str)


def test_disconnect():
    """Tests disconnect endpoint"""
    with req.get(base + "disconnect",
                 headers={"X-Token": token}) as marko:
        assert marko.status_code == 204


def test_files_no_auth():
    """Tests files endpoint without auth"""
    header = {"Content-Type": "application/json"}
    with req.post(base + "files", headers=header,
                  data=temp_data) as marko:
        assert marko.status_code == 401
        payload = {"error": "Unauthorized"}
        assert marko.json() == payload


def test_files():
    """Tests files endpoint"""
    header = {"Content-Type": "application/json",
              "X-Token": token
              }
    with req.post(base + "files", headers=header,
                  data=temp_data) as marko:
        assert marko.status_code == 201
        assert isinstance(marko.json()["name"], str)
        assert isinstance(marko.json()["userId"], str)
        assert isinstance(marko.json()["name"], str)
        assert isinstance(marko.json()["type"], str)
        assert isinstance(marko.json()["isPublic"], bool)
        assert isinstance(marko.json()["parentId"], bool)


def test_files_id_without_auth():
    """Tests files endpoint without auth"""
    header = {"Content-Type": "application/json"}
    with req.get(base + "files", headers=header) as marko:
        assert marko.status_code == 401
        payload = {"error": "Unauthorized"}
        assert marko.json() == payload


def test_files_id():
    """Tests files endpoint"""
    header = {"Content-Type": "application/json",
              "X-Token": token
              }
    with req.get(base + "files", headers=header) as marko:
        assert isinstance(marko.json()["name"], str)
        assert isinstance(marko.json()["userId"], str)
        assert isinstance(marko.json()["name"], str)
        assert isinstance(marko.json()["type"], str)
        assert isinstance(marko.json()["isPublic"], bool)
        assert isinstance(marko.json()["parentId"], bool)
