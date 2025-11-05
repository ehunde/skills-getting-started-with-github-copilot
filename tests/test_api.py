from fastapi.testclient import TestClient
from src.app import app, activities
import urllib.parse
import uuid

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect at least one known activity from the seeded data
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = f"test+{uuid.uuid4().hex[:8]}@mergington.edu"

    # Ensure email is not present at start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Successful signup
    url = f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
    r = client.post(url)
    assert r.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    r2 = client.post(url)
    assert r2.status_code == 400

    # Successful unregister
    url_un = f"/activities/{urllib.parse.quote(activity)}/unregister?email={urllib.parse.quote(email)}"
    r3 = client.post(url_un)
    assert r3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should fail
    r4 = client.post(url_un)
    assert r4.status_code == 400


def test_signup_nonexistent_activity():
    email = f"test+{uuid.uuid4().hex[:8]}@mergington.edu"
    url = f"/activities/{urllib.parse.quote('No Such Activity')}/signup?email={urllib.parse.quote(email)}"
    r = client.post(url)
    assert r.status_code == 404
