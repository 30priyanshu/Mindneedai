import pytest
from unittest.mock import Mock
from server.features.notifications.service import NotificationService
from server.features.notifications.schemas import NotificationCreate

def test_notification_service_create():
    # Arrange
    mock_repo = Mock()
    service = NotificationService(repo=mock_repo)
    
    # Act
    service.create("user_1", NotificationCreate(message="Test", type="alert"))
    
    # Assert
    mock_repo.create.assert_called_once()
    args, _ = mock_repo.create.call_args
    assert args[0]["user_id"] == "user_1"
    assert args[0]["message"] == "Test"

def test_notification_clear_all():
    # Arrange
    mock_repo = Mock()
    service = NotificationService(repo=mock_repo)
    
    # Act
    service.clear_all("user_1")
    
    # Assert
    mock_repo.clear_all_for_user.assert_called_once_with("user_1")
