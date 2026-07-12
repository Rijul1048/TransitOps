from django.db.models import Q


def apply_search(qs, fields: list[str], query: str | None):
    """Filter a queryset by case-insensitive partial match across given fields."""
    if not query or not query.strip():
        return qs
    q_filter = Q()
    for field in fields:
        q_filter |= Q(**{f"{field}__icontains": query.strip()})
    return qs.filter(q_filter)
