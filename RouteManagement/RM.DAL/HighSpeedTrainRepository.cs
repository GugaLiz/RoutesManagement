using RM.Common;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.DAL
{
    public class HighSpeedTrainRepository : BaseRepository<HighSpeedTrain>
    {
        public HighSpeedTrainRepository(IDatabase db) : base(db)
        {
        }

        public override HighSpeedTrain Get(int id)
        {
            return db.SingleOrDefault<HighSpeedTrain>(@"SELECT
Id, Name,
Coordinates,
LineName, Memo,
Creator, CreateDT, UpdateDT, Updator
FROM [HighSpeedTrain] WHERE Id=@0", id);
        }

        public override Page<HighSpeedTrain> List(PageCondition cond)
        {
            var sql = new Sql(@"SELECT 
Id, Name,
LineName,
Coordinates, 
Memo,
Creator, CreateDT, UpdateDT, Updator
FROM [HighSpeedTrain]
");

            sql.Append(" ORDER BY CreateDT DESC ");
            var list = db.Page<HighSpeedTrain>(cond.PageNumber, cond.PageSize, sql);
            return list;
        }

        public void Save(HighSpeedTrain item)
        {
            db.Insert(item);
        }

        public int Remove(int id)
        {
            return db.Delete<HighSpeedTrain>(id);
        }
    }
}
