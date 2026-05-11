import pytest
from unittest.mock import Mock, patch
from server.features.dashboard.service import DashboardService

def test_dashboard_service_get_doctor_stats():
    # Arrange
    mock_db = Mock()
    mock_repo = Mock()
    mock_form_repo = Mock()
    mock_metric_repo = Mock()
    mock_user_repo = Mock()
    
    service = DashboardService(
        db=mock_db,
        interaction_repo=mock_repo,
        form_repo=mock_form_repo,
        health_metric_repo=mock_metric_repo,
        user_repo=mock_user_repo
    )
    
    mock_user_repo.get_patients_for_doctor.return_value = [{"user_id": "1", "name": "Test"}]
    mock_form_repo.count_forms_by_users_and_date.return_value = 5
    mock_repo.get_engagement_metrics.return_value = {"active_minutes": 120}
    
    # Act
    stats = service.get_doctor_stats("doc_1")
    
    # Assert
    assert stats.total_patients == 1
    assert stats.total_forms_reviewed >= 0
    assert "weekly_engagement" in str(stats)
