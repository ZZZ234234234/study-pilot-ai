from sqlalchemy import inspect


def row_dict(row, exclude: tuple[str, ...] = ()) -> dict:
    return {
        column.key: getattr(row, column.key)
        for column in inspect(row).mapper.column_attrs
        if column.key not in exclude
    }
