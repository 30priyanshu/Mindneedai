def build_emergency_alert_body(user_name: str, issue_description: str) -> str:
    """Build a plain text emergency alert email body."""
    return f"""URGENT: Emergency Alert
    
Dear Admin,

An emergency alert was triggered by {user_name}.
Issue: {issue_description}

Please check the dashboard immediately.
"""


def build_notification_body(user_name: str, message: str) -> str:
    """Build a plain text standard notification email body."""
    return f"""Hello {user_name},

You have a new notification:
{message}

Thank you,
MindNeedAI Team
"""
