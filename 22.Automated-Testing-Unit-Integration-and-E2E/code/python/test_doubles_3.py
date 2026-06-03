from unittest.mock import Mock

# The unit depends on injected collaborators (§6).
def greet(repo, notifier, user_id):
    user = repo.find_by_id(user_id)          # collaborator 1
    notifier.send(user.email, f"Hi {user.name}")  # collaborator 2 (the interaction)

def test_greet_sends_email():
    # STUB: a Mock configured to return a canned user
    repo = Mock()
    repo.find_by_id.return_value = User(email="a@x.com", name="Ada")
    notifier = Mock()                        # will record calls (acts as spy/mock)

    greet(repo, notifier, "u1")              # act

    # assert the INTERACTION happened exactly as expected
    notifier.send.assert_called_once_with("a@x.com", "Hi Ada")
