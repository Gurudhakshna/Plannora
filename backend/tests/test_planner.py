"""
Tests for Planner CRUD and filtering endpoints.

Covers:
1. Create planner item
2. List planner items
3. Get planner item by ID
4. Update planner item
5. Delete planner item
6. Authentication required
7. User isolation (cannot access/modify/delete other user's planner item)
8. Invalid planner item ID (404)
9. Filtering by status and date
"""

from tests.conftest import auth_header


def _create_sample_planner_item(
    client, headers, title="Study Session", description="Chapter 4", date_str="2026-08-25", status="pending"
):
    payload = {
        "title": title,
        "description": description,
        "date": date_str,
        "status": status,
    }
    return client.post("/api/v1/planner", json=payload, headers=headers)


class TestCreatePlannerItem:
    def test_create_planner_item_success(self, client):
        headers = auth_header(client)
        resp = _create_sample_planner_item(client, headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Study Session"
        assert data["description"] == "Chapter 4"
        assert data["date"] == "2026-08-25"
        assert data["status"] == "pending"
        assert "id" in data
        assert "user_id" in data

    def test_create_planner_item_unauthenticated(self, client):
        resp = client.post("/api/v1/planner", json={"title": "Test Task"})
        assert resp.status_code == 401


class TestListPlannerItems:
    def test_list_planner_items_own_only(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        _create_sample_planner_item(client, headers_a, title="Task A")
        _create_sample_planner_item(client, headers_b, title="Task B")

        resp_a = client.get("/api/v1/planner", headers=headers_a)
        assert resp_a.status_code == 200
        titles_a = [item["title"] for item in resp_a.json()]
        assert "Task A" in titles_a
        assert "Task B" not in titles_a

    def test_filter_by_status(self, client):
        headers = auth_header(client)
        _create_sample_planner_item(client, headers, title="Pending Task", status="pending")
        _create_sample_planner_item(client, headers, title="Completed Task", status="completed")

        resp_pending = client.get("/api/v1/planner?status=pending", headers=headers)
        assert resp_pending.status_code == 200
        items = resp_pending.json()
        assert all(i["status"] == "pending" for i in items)
        assert any(i["title"] == "Pending Task" for i in items)
        assert not any(i["title"] == "Completed Task" for i in items)

    def test_filter_by_date(self, client):
        headers = auth_header(client)
        _create_sample_planner_item(client, headers, title="Aug 25 Task", date_str="2026-08-25")
        _create_sample_planner_item(client, headers, title="Aug 30 Task", date_str="2026-08-30")

        resp_date = client.get("/api/v1/planner?date=2026-08-25", headers=headers)
        assert resp_date.status_code == 200
        items = resp_date.json()
        assert len(items) == 1
        assert items[0]["title"] == "Aug 25 Task"


class TestGetPlannerItem:
    def test_get_planner_item_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_planner_item(client, headers)
        item_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/planner/{item_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == item_id

    def test_get_other_user_planner_item(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_planner_item(client, headers_a)
        item_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/planner/{item_id}", headers=headers_b)
        assert resp.status_code == 404

    def test_get_nonexistent_planner_item(self, client):
        headers = auth_header(client)
        resp = client.get("/api/v1/planner/9999", headers=headers)
        assert resp.status_code == 404


class TestUpdatePlannerItem:
    def test_update_planner_item_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_planner_item(client, headers)
        item_id = create_resp.json()["id"]

        update_payload = {"title": "Updated Title", "status": "completed"}
        resp = client.put(f"/api/v1/planner/{item_id}", json=update_payload, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        assert resp.json()["status"] == "completed"

    def test_update_other_user_planner_item(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_planner_item(client, headers_a)
        item_id = create_resp.json()["id"]

        resp = client.put(f"/api/v1/planner/{item_id}", json={"title": "Hacked"}, headers=headers_b)
        assert resp.status_code == 404


class TestDeletePlannerItem:
    def test_delete_planner_item_success(self, client):
        headers = auth_header(client)
        create_resp = _create_sample_planner_item(client, headers)
        item_id = create_resp.json()["id"]

        del_resp = client.delete(f"/api/v1/planner/{item_id}", headers=headers)
        assert del_resp.status_code == 204

        get_resp = client.get(f"/api/v1/planner/{item_id}", headers=headers)
        assert get_resp.status_code == 404

    def test_delete_other_user_planner_item(self, client):
        headers_a = auth_header(client, email="user_a@example.com", password="Password123!")
        headers_b = auth_header(client, email="user_b@example.com", password="Password123!")

        create_resp = _create_sample_planner_item(client, headers_a)
        item_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/planner/{item_id}", headers=headers_b)
        assert resp.status_code == 404
